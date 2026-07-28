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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string; id: string }> }
) {
  const { id } = await params;
  if (!(await requireUser())) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const rows = await query(
      `SELECT t.traveler_id, t.traveler_name, t.is_active
       FROM flight_booking_travelers bt
       JOIN trip_travelers t ON t.traveler_id = bt.traveler_id
       WHERE bt.booking_id = ?
       ORDER BY t.traveler_name`,
      [id]
    );
    return NextResponse.json({ travelers: rows });
  } catch (err) {
    console.error('List booking travelers failed:', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tripId: string; id: string }> }
) {
  const { id } = await params;
  if (!(await requireUser())) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const { traveler_ids } = await request.json();
    if (!Array.isArray(traveler_ids)) {
      return NextResponse.json({ error: 'traveler_ids must be an array' }, { status: 400 });
    }

    await withTransaction(async (tx) => {
      await queryTx(tx, 'DELETE FROM flight_booking_travelers WHERE booking_id = ?', [id]);
      for (const tid of traveler_ids) {
        await queryTx(
          tx,
          'INSERT INTO flight_booking_travelers (booking_id, traveler_id) VALUES (?, ?)',
          [id, tid]
        );
      }
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Update booking travelers failed:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}