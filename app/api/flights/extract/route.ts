import { NextResponse } from 'next/server';
import { extractFlightBooking } from '@/app/lib/services/flight-extraction';

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED = new Set(['application/pdf', 'text/plain']);

export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');
    const tripId = formData.get('trip_id');

    if (!(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!tripId) {
      return NextResponse.json({ error: 'trip_id is required' }, { status: 400 });
    }

    if (file.size === 0) {
      return NextResponse.json({ error: 'File is empty' }, { status: 400 });
    }

    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: 'File is too large. Maximum size is 10 MB.' },
        { status: 400 }
      );
    }

    // Some browsers send an empty or odd mime type — fall back to the extension.
    let mimeType = file.type;
    if (!ALLOWED.has(mimeType)) {
      const name = file.name.toLowerCase();
      if (name.endsWith('.pdf')) mimeType = 'application/pdf';
      else if (name.endsWith('.txt')) mimeType = 'text/plain';
      else {
        return NextResponse.json(
          { error: 'Only PDF and plain text files are supported.' },
          { status: 400 }
        );
      }
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const result = await extractFlightBooking(buffer, mimeType);

    // The file is held in memory only. It is written to disk by the save
    // endpoint once the user confirms, so a failed or abandoned extraction
    // leaves nothing behind.
    return NextResponse.json({
      ...result,
      original_filename: file.name,
      mime_type: mimeType,
      file_size_bytes: file.size,
      file_base64: buffer.toString('base64'),
      trip_id: Number(tripId),
    });
  } catch (err) {
    console.error('Flight extraction route failed:', err);
    return NextResponse.json(
      { error: 'Something went wrong reading the document.' },
      { status: 500 }
    );
  }
}