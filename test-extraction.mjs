#!/usr/bin/env node
/**
 * Standalone extraction test — no database, no UI.
 *
 *   node test-extraction.mjs ./samples/webjet.pdf
 *   node test-extraction.mjs ./samples/*.pdf
 *
 * Requires ANTHROPIC_API_KEY in the environment or in .env.local
 */

import Anthropic from '@anthropic-ai/sdk';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

// --- load .env.local if present ------------------------------------
if (!process.env.ANTHROPIC_API_KEY && existsSync('.env.local')) {
  const env = await readFile('.env.local', 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.+?)\s*$/);
    if (m) process.env[m[1]] ??= m[2].replace(/^["']|["']$/g, '');
  }
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('ANTHROPIC_API_KEY not set. Put it in .env.local or export it.');
  process.exit(1);
}

const MODEL = 'claude-haiku-4-5-20251001';

const SYSTEM_PROMPT = `You extract structured flight booking data from itinerary and e-ticket documents.

Return ONLY a JSON object. No preamble, no markdown fences, no commentary.

## Output shape

{
  "booking": {
    "agency_reference": string | null,
    "airline_pnr": string | null,
    "booking_source": string | null,
    "booking_date": string | null,
    "total_paid": number | null,
    "base_fare": number | null,
    "currency_code": string | null,
    "fare_breakdown": [{ "label": string, "amount": number }] | null
  },
  "legs": [
    {
      "leg_order": number,
      "departure_airport_code": string | null,
      "departure_airport_name": string | null,
      "departure_city": string | null,
      "departure_terminal": string | null,
      "departure_datetime": string | null,
      "arrival_airport_code": string | null,
      "arrival_airport_name": string | null,
      "arrival_city": string | null,
      "arrival_terminal": string | null,
      "arrival_datetime": string | null,
      "airline": string | null,
      "airline_code": string | null,
      "flight_number": string | null,
      "cabin_class": string | null,
      "fare_class": string | null,
      "duration_minutes": number | null,
      "stops_count": number | null,
      "baggage_allowance": string | null,
      "checkin_reference": string | null
    }
  ],
  "passenger_names": [string],
  "uncertain_fields": [string],
  "document_notes": string | null
}

## Field rules

REFERENCES — these are three different things. Do not conflate them.
- agency_reference: the booking site's own reference. Labelled "Booking number", "Webjet reference", "Booking Reference". Examples: "BAU-10890865", "22522203".
- airline_pnr: the airline's record locator, usually 6 alphanumeric characters. Labelled "PNR", "Airline Reference", "Online check-in number", "Booking Reference" when clearly the carrier's. Examples: "YZQMZG", "DMLQV3", "6K4R88".
- If a document shows both, populate both. If only one exists, decide which it is from the label and leave the other null. Never copy the same value into both.
- checkin_reference goes on the leg, not the booking, when the document ties it to a specific segment.

booking_source: the issuing agency or airline as printed. "Webjet", "Travix", "Trip.com", "Qantas". Null if unclear.

booking_date: ISO date (YYYY-MM-DD) of when the booking was made or the ticket issued. Not the travel date.

DATETIMES — this is the highest-risk field. Get it right.
- Format: "YYYY-MM-DDTHH:MM". Local time at that airport. No timezone offset, no seconds.
- Each leg has its own explicit arrival date in most documents. Use it.
- If an arrival date is NOT printed and you must infer it: when arrival time is earlier than departure time, the arrival is the next day. Add this to uncertain_fields.
- Never assume a leg arrives on its departure date without checking.
- 12-hour times: "12:10 AM" is 00:10, "12:10 PM" is 12:10. Be careful with midnight and noon.

AIRPORTS
- Populate the code only if the document actually prints it. Do not infer or recall codes from airport names — the application resolves those separately.
- Always populate airport_name and city when present, even if a code was also given.
- Terminal only when explicitly stated.

LEGS
- One entry per flight segment. A connection through a hub is two legs, not one.
- leg_order starts at 1 and follows the document's travel sequence.
- A round trip is simply legs whose route returns to the origin. Do not add any grouping or type field.
- stops_count is for an intermediate landing on the SAME flight number. A change of flight number means separate legs, and stops_count is 0 on each.

airline_code: the two-character IATA carrier prefix, derived from the flight number ("MH134" gives "MH"). Null if the flight number is absent.

duration_minutes: convert stated flight time to whole minutes. "8h 30m" gives 510.

baggage_allowance: copy verbatim as printed. Do not normalise, convert units, or restructure. "total weight not exceeding 20 Kg" stays exactly that.

PRICING
- Many e-tickets carry no price at all. Leave all pricing null rather than guessing.
- total_paid is the final amount charged, including agency fees and surcharges.
- base_fare is the airline's fare before agency fees, when itemised separately.
- fare_breakdown: only when the document itemises. Copy labels as printed.
- currency_code: ISO 4217. Infer from an explicit statement like "All prices are in Australian Dollars" (AUD) or an unambiguous symbol. Null if genuinely unclear.

passenger_names: as printed on the document, including any "SURNAME/GIVENNAME" formatting. Used for reference only; the app assigns travellers separately.

## uncertain_fields

List the dotted path of every field you inferred, guessed, or could not read cleanly. Use "booking.total_paid" or "legs[0].arrival_datetime" notation.

Include a path when:
- you derived the value rather than reading it (an inferred next-day arrival, a computed duration)
- the document is ambiguous about which of two labels a value belongs to
- text was unclear, cut off, or contradictory
- you had to choose between plausible interpretations

Do NOT include a path merely because the field is null and absent from the document. Absence is not uncertainty.

Being honest here matters more than appearing confident. A flagged field costs the user a glance; an unflagged wrong field costs them a missed flight.

## document_notes

One short sentence if something about the document is worth the user knowing — it covers only part of a journey, it is a quote rather than a confirmation, times appear provisional. Otherwise null.

If the document is not a flight booking at all, return the shape with empty legs and set document_notes to say so.`;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function stripFences(text) {
  return text.replace(/^\s*```(?:json)?\s*/i, '').replace(/\s*```\s*$/, '').trim();
}

async function extract(filePath) {
  const buf = await readFile(filePath);
  const ext = path.extname(filePath).toLowerCase();

  let content;
  if (ext === '.pdf') {
    content = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: buf.toString('base64') },
      },
      { type: 'text', text: 'Extract the flight booking data from this document as JSON.' },
    ];
  } else {
    content = [
      {
        type: 'text',
        text:
          'Extract the flight booking data from this document as JSON.\n\n<document>\n' +
          buf.toString('utf8') +
          '\n</document>',
      },
    ];
  }

  const started = Date.now();
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content }],
  });
  const elapsed = Date.now() - started;

  const raw = res.content
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('');

  let parsed = null;
  let parseError = null;
  try {
    parsed = JSON.parse(stripFences(raw));
  } catch (e) {
    parseError = e.message;
  }

  return { parsed, raw, parseError, usage: res.usage, elapsed };
}

function cost(usage) {
  // Haiku 4.5: $1 / $5 per million tokens
  return (usage.input_tokens / 1e6) * 1 + (usage.output_tokens / 1e6) * 5;
}

function summarise(r) {
  const b = r.parsed?.booking ?? {};
  const legs = r.parsed?.legs ?? [];
  const unc = new Set(r.parsed?.uncertain_fields ?? []);

  const mark = (p) => (unc.has(p) ? ' ⚠' : '');

  console.log(`  source     : ${b.booking_source ?? '—'}`);
  console.log(`  agency ref : ${b.agency_reference ?? '—'}${mark('booking.agency_reference')}`);
  console.log(`  airline PNR: ${b.airline_pnr ?? '—'}${mark('booking.airline_pnr')}`);
  console.log(
    `  paid       : ${b.total_paid != null ? `${b.currency_code ?? '?'} ${b.total_paid}` : '—'}${mark('booking.total_paid')}`
  );
  console.log(`  passengers : ${(r.parsed?.passenger_names ?? []).join(', ') || '—'}`);
  console.log(`  legs       : ${legs.length}`);

  legs.forEach((l, i) => {
    const dep = l.departure_airport_code || l.departure_airport_name || l.departure_city || '?';
    const arr = l.arrival_airport_code || l.arrival_airport_name || l.arrival_city || '?';
    console.log(
      `    ${i + 1}. ${l.flight_number ?? '?'}  ${dep} → ${arr}` +
        `  ${l.departure_datetime ?? '?'}${mark(`legs[${i}].departure_datetime`)}` +
        ` → ${l.arrival_datetime ?? '?'}${mark(`legs[${i}].arrival_datetime`)}` +
        `  ${l.cabin_class ?? ''}`
    );
    if (l.baggage_allowance) console.log(`       baggage: ${l.baggage_allowance}`);
  });

  if (unc.size) console.log(`  uncertain  : ${[...unc].join(', ')}`);
  if (r.parsed?.document_notes) console.log(`  notes      : ${r.parsed.document_notes}`);
}

// --- main ----------------------------------------------------------
const files = process.argv.slice(2);
if (!files.length) {
  console.error('Usage: node test-extraction.mjs <file.pdf> [more.pdf ...]');
  process.exit(1);
}

await mkdir('extraction-output', { recursive: true });

let totalCost = 0;

for (const f of files) {
  console.log('\n' + '─'.repeat(70));
  console.log(path.basename(f));
  console.log('─'.repeat(70));

  try {
    const r = await extract(f);
    totalCost += cost(r.usage);

    if (r.parseError) {
      console.log(`  JSON PARSE FAILED: ${r.parseError}`);
      console.log('  raw response follows:\n');
      console.log(r.raw.slice(0, 2000));
    } else {
      summarise(r);
      const out = path.join('extraction-output', path.basename(f) + '.json');
      await writeFile(out, JSON.stringify(r.parsed, null, 2));
      console.log(`  → ${out}`);
    }

    console.log(
      `  tokens: ${r.usage.input_tokens} in / ${r.usage.output_tokens} out` +
        `  ·  $${cost(r.usage).toFixed(4)}  ·  ${(r.elapsed / 1000).toFixed(1)}s`
    );
  } catch (e) {
    console.log(`  ERROR: ${e.message}`);
  }
}

console.log('\n' + '─'.repeat(70));
console.log(`total: $${totalCost.toFixed(4)}`);
