'use client';

import { useState } from 'react';
import AirportCombobox, { type AirportChoice } from '@/app/components/ui/AirportCombobox';
import CircleIconButton from '@/app/components/ui/CircleIconButton';
import TogglePill from '@/app/components/ui/TogglePill';
import NoteField from '@/app/components/ui/NoteField';
import { cn } from '@/app/lib/utils';
import type { FlightOption } from '@/app/lib/types/flight';

interface Currency { currency_code: string; currency_name: string; }

interface Props {
  tripId: number;
  option?: FlightOption | null;
  currencies: Currency[];
  onSuccess: () => void;
  onCancel: () => void;
}

const empty: FlightOption = {
  flight_type: 'one_way',
  departure_airport: null, arrival_airport: null,
  connection_1_airport: null, connection_2_airport: null,
  airline: null,
  depart_datetime: null, arrive_datetime: null,
  return_depart_datetime: null, return_arrive_datetime: null,
  outbound_duration_minutes: null, return_duration_minutes: null,
  price: null, currency_code: null, notes: null,
};

const splitDT = (dt: string | null) => {
  if (!dt) return { date: '', time: '' };
  const [date, time] = dt.split('T');
  return { date: date ?? '', time: time?.slice(0, 5) ?? '' };
};

export default function FlightEntryForm({ tripId, option, currencies, onSuccess, onCancel }: Props) {
  const [form, setForm] = useState<FlightOption>(option ?? empty);
  const [connections, setConnections] = useState<'0' | '1' | '2'>(
    option?.connection_2_airport ? '2' : option?.connection_1_airport ? '1' : '0'
  );
  const [outHours, setOutHours] = useState(option?.outbound_duration_minutes != null ? String(Math.floor(option.outbound_duration_minutes / 60)) : '');
  const [outMins, setOutMins] = useState(option?.outbound_duration_minutes != null ? String(option.outbound_duration_minutes % 60) : '');
  const [retHours, setRetHours] = useState(option?.return_duration_minutes != null ? String(Math.floor(option.return_duration_minutes / 60)) : '');
  const [retMins, setRetMins] = useState(option?.return_duration_minutes != null ? String(option.return_duration_minutes % 60) : '');
  const [depDate, setDepDate] = useState(splitDT(option?.depart_datetime ?? null).date);
  const [depTime, setDepTime] = useState(splitDT(option?.depart_datetime ?? null).time);
  const [arrDate, setArrDate] = useState(splitDT(option?.arrive_datetime ?? null).date);
  const [arrTime, setArrTime] = useState(splitDT(option?.arrive_datetime ?? null).time);
  const [retDepDate, setRetDepDate] = useState(splitDT(option?.return_depart_datetime ?? null).date);
  const [retDepTime, setRetDepTime] = useState(splitDT(option?.return_depart_datetime ?? null).time);
  const [retArrDate, setRetArrDate] = useState(splitDT(option?.return_arrive_datetime ?? null).date);
  const [retArrTime, setRetArrTime] = useState(splitDT(option?.return_arrive_datetime ?? null).time);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof FlightOption>(k: K, v: FlightOption[K]) => setForm((f) => ({ ...f, [k]: v }));

  const setConn = (n: '0' | '1' | '2') => {
    setConnections(n);
    if (n < '2') set('connection_2_airport', null);
    if (n < '1') set('connection_1_airport', null);
  };

  const canSave = !!form.departure_airport && !!form.arrival_airport;

  const save = async () => {
    setSaving(true);
    setError(null);
    const compose = (date: string, time: string) => (date ? (time ? `${date}T${time}` : date) : null);
    const toMin = (h: string, m: string) => (h || m ? Number(h || 0) * 60 + Number(m || 0) : null);

    const payload = {
      ...form,
      outbound_duration_minutes: toMin(outHours, outMins),
      return_duration_minutes: form.flight_type === 'round_trip' ? toMin(retHours, retMins) : null,
      depart_datetime: compose(depDate, depTime),
      arrive_datetime: compose(arrDate, arrTime),
      return_depart_datetime: form.flight_type === 'round_trip' ? compose(retDepDate, retDepTime) : null,
      return_arrive_datetime: form.flight_type === 'round_trip' ? compose(retArrDate, retArrTime) : null,
    };
    const editing = form.flight_option_id != null;
    try {
      const res = await fetch(
        editing ? `/api/trips/${tripId}/flights/${form.flight_option_id}` : `/api/trips/${tripId}/flights`,
        { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      );
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to save');
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const label = 'block text-xs text-white/50 mb-1.5';
  const field = 'w-full px-3 py-2 rounded-lg text-sm bg-white/10 border border-white/20 text-white focus:outline-none focus:border-primary-400 transition-colors';

  return (
    <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl p-5">
      <h3 className="text-lg font-semibold text-white mb-4">
        {form.flight_option_id != null ? 'Edit option' : 'Add flight option'}
      </h3>

      {/* Row 1 — route, type, connections, airline, duration */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <div className={label}>Route</div>
          <div className="flex items-center gap-2">
            <div className="w-44">
              <AirportCombobox value={form.departure_airport} onSelect={(a: AirportChoice) => set('departure_airport', a.iata_code)} />
            </div>
            <span className="text-white/40">→</span>
            <div className="w-44">
              <AirportCombobox value={form.arrival_airport} onSelect={(a: AirportChoice) => set('arrival_airport', a.iata_code)} />
            </div>
          </div>
        </div>

        <div>
          <div className={label}>Type</div>
          <TogglePill
            value={form.flight_type}
            onChange={(v) => set('flight_type', v)}
            options={[{ value: 'one_way', label: 'one-way' }, { value: 'round_trip', label: 'return' }]}
          />
        </div>

        <div>
          <div className={label}>Connections</div>
          <TogglePill
            value={connections}
            onChange={setConn}
            options={[{ value: '0', label: 'direct' }, { value: '1', label: '1 stop' }, { value: '2', label: '2 stops' }]}
          />
        </div>

        <div className="flex-1 min-w-[160px]">
          <div className={label}>Airline</div>
          <input className={field} value={form.airline ?? ''} onChange={(e) => set('airline', e.target.value)} />
        </div>
      </div>

      {/* Connection vias */}
      {connections >= '1' && (
        <div className="flex items-center gap-2 mb-4 pl-1">
          <span className="text-xs text-white/40 w-8">via</span>
          <div className="w-44">
            <AirportCombobox value={form.connection_1_airport} highlight onSelect={(a: AirportChoice) => set('connection_1_airport', a.iata_code)} />
          </div>
          {connections === '2' && (
            <div className="w-44">
              <AirportCombobox value={form.connection_2_airport} highlight onSelect={(a: AirportChoice) => set('connection_2_airport', a.iata_code)} />
            </div>
          )}
        </div>
      )}

      {/* Row 2 — outbound departure, outbound arrival, price */}
      <div className="flex flex-wrap items-end gap-4 mb-4">
        <div>
          <div className={label}>{form.flight_type === 'round_trip' ? 'Outbound departure' : 'Departure'}</div>
          <div className="flex gap-2">
            <input type="date" className={cn(field, 'w-40')} value={depDate} onChange={(e) => setDepDate(e.target.value)} />
            <input type="time" className={cn(field, 'w-32')} value={depTime} onChange={(e) => setDepTime(e.target.value)} />
          </div>
        </div>
        <div>
          <div className={label}>{form.flight_type === 'round_trip' ? 'Outbound arrival' : 'Arrival'}</div>
          <div className="flex gap-2">
            <input type="date" className={cn(field, 'w-40')} value={arrDate} onChange={(e) => setArrDate(e.target.value)} />
            <input type="time" className={cn(field, 'w-32')} value={arrTime} onChange={(e) => setArrTime(e.target.value)} />
          </div>
        </div>
        <div>
          <div className={label}>Duration</div>
          <div className="flex items-center gap-1">
            <input className={cn(field, 'w-14 text-center')} placeholder="h" value={outHours} onChange={(e) => setOutHours(e.target.value.replace(/\D/g, ''))} />
            <span className="text-white/40 text-sm">h</span>
            <input className={cn(field, 'w-14 text-center')} placeholder="m" value={outMins} onChange={(e) => setOutMins(e.target.value.replace(/\D/g, ''))} />
            <span className="text-white/40 text-sm">m</span>
          </div>
        </div>
        <div>
          <div className={label}>Price</div>
          <div className="flex gap-2">
            <select className={cn(field, 'w-24')} value={form.currency_code ?? ''} onChange={(e) => set('currency_code', e.target.value)}>
              <option value="" className="bg-gray-800">—</option>
              {currencies.map((c) => (
                <option key={c.currency_code} value={c.currency_code} className="bg-gray-800">{c.currency_code}</option>
              ))}
            </select>
            <input type="number" className={cn(field, 'w-32')} placeholder="0.00" value={form.price ?? ''} onChange={(e) => set('price', e.target.value ? parseFloat(e.target.value) : null)} />
          </div>
        </div>
      </div>

      {/* Row 3 — return departure, return arrival (return only) */}
      {form.flight_type === 'round_trip' && (
        <div className="flex flex-wrap items-end gap-4 mb-4">
          <div>
            <div className={label}>Return departure</div>
            <div className="flex gap-2">
              <input type="date" className={cn(field, 'w-40')} value={retDepDate} onChange={(e) => setRetDepDate(e.target.value)} />
              <input type="time" className={cn(field, 'w-32')} value={retDepTime} onChange={(e) => setRetDepTime(e.target.value)} />
            </div>
          </div>
          <div>
            <div className={label}>Return arrival</div>
            <div className="flex gap-2">
              <input type="date" className={cn(field, 'w-40')} value={retArrDate} onChange={(e) => setRetArrDate(e.target.value)} />
              <input type="time" className={cn(field, 'w-32')} value={retArrTime} onChange={(e) => setRetArrTime(e.target.value)} />
            </div>
          </div>
          <div>
            <div className={label}>Duration</div>
            <div className="flex items-center gap-1">
              <input className={cn(field, 'w-14 text-center')} placeholder="h" value={retHours} onChange={(e) => setRetHours(e.target.value.replace(/\D/g, ''))} />
              <span className="text-white/40 text-sm">h</span>
              <input className={cn(field, 'w-14 text-center')} placeholder="m" value={retMins} onChange={(e) => setRetMins(e.target.value.replace(/\D/g, ''))} />
              <span className="text-white/40 text-sm">m</span>
            </div>
          </div>
        </div>
      )}

      {/* Row 4 — note */}
      <div className="mb-4">
        <div className={label}>Note</div>
        <NoteField value={form.notes ?? ''} onChange={(v) => set('notes', v)} placeholder="Cheapest with reasonable layover" />
      </div>

      {error && <div className="mb-3 p-2 bg-red-500/20 border border-red-400/30 rounded-lg text-red-300 text-sm">{error}</div>}

      <div className="flex justify-end gap-2">
        <CircleIconButton variant="default" size="small" onClick={onCancel} title="Cancel"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>} />
        <CircleIconButton variant="primary" size="small" onClick={save} isLoading={saving} disabled={!canSave} title="Save option"
          icon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>} />
      </div>
    </div>
  );
}