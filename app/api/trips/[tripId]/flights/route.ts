import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { query } from '@/app/lib/db';

export const runtime = 'nodejs';

async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const session = await getSession(token);
  return session?.user_id ?? null;
}

export async function GET(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!(await requireUser())) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const options = await query(
      `SELECT * FROM flight_options WHERE trip_id = ? ORDER BY price ASC`,
      [tripId]
    );
    return NextResponse.json(options);
  } catch (err) {
    console.error('List flight options failed:', err);
    return NextResponse.json({ error: 'Failed to load options' }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ tripId: string }> }) {
  const { tripId } = await params;
  if (!(await requireUser())) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const o = await request.json();
    if (!o.departure_airport || !o.arrival_airport) {
      return NextResponse.json({ error: 'Route is required' }, { status: 400 });
    }
    const res = await query<{ flight_option_id: number }>(
      `INSERT INTO flight_options
        (trip_id, flight_type, departure_airport, arrival_airport,
          connection_1_airport, connection_2_airport, airline,
          depart_datetime, arrive_datetime,
          return_depart_datetime, return_arrive_datetime,
          outbound_duration_minutes, return_duration_minutes, price, currency_code, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING flight_option_id`,
      [
        tripId, o.flight_type ?? 'one_way',
        o.departure_airport, o.arrival_airport,
        o.connection_1_airport ?? null, o.connection_2_airport ?? null,
        o.airline ?? null,
        o.depart_datetime ?? null, o.arrive_datetime ?? null,
        o.return_depart_datetime ?? null, o.return_arrive_datetime ?? null,
        o.outbound_duration_minutes ?? null, o.return_duration_minutes ?? null,
        o.price ?? null, o.currency_code ?? null, o.notes ?? null,
      ]
    );
    return NextResponse.json({ flight_option_id: res[0].flight_option_id });
  } catch (err) {
    console.error('Create flight option failed:', err);
    return NextResponse.json({ error: 'Failed to create option' }, { status: 500 });
  }
}