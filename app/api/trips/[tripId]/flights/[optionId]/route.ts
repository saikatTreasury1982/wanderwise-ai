import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { query, withTransaction, queryTx } from '@/app/lib/db';

export const runtime = 'nodejs';

async function requireUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  const session = await getSession(token);
  return session?.user_id ?? null;
}

export async function PUT(request: Request, { params }: { params: Promise<{ tripId: string; optionId: string }> }) {
  const { optionId } = await params;
  if (!(await requireUser())) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    const o = await request.json();
    await query(
      `UPDATE flight_options SET
         flight_type = ?, departure_airport = ?, arrival_airport = ?,
         connection_1_airport = ?, connection_2_airport = ?, airline = ?,
         depart_datetime = ?, arrive_datetime = ?,
         return_depart_datetime = ?, return_arrive_datetime = ?,
         outbound_duration_minutes = ?, return_duration_minutes = ?,
         price = ?, currency_code = ?, notes = ?, updated_at = datetime('now')
       WHERE flight_option_id = ?`,
      [
        o.flight_type ?? 'one_way', o.departure_airport, o.arrival_airport,
        o.connection_1_airport ?? null, o.connection_2_airport ?? null,
        o.airline ?? null,
        o.depart_datetime ?? null, o.arrive_datetime ?? null,
        o.return_depart_datetime ?? null, o.return_arrive_datetime ?? null,
        o.outbound_duration_minutes ?? null, o.return_duration_minutes ?? null,
        o.price ?? null, o.currency_code ?? null, o.notes ?? null,
        optionId,
      ]
    );
    return NextResponse.json({ flight_option_id: Number(optionId) });
  } catch (err) {
    console.error('Update option failed:', err);
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ tripId: string; optionId: string }> }) {
  const { optionId } = await params;
  if (!(await requireUser())) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  try {
    await query(`DELETE FROM flight_options WHERE flight_option_id = ?`, [optionId]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete option failed:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}