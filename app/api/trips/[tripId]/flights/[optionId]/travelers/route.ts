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
  { params }: { params: Promise<{ tripId: string; optionId: string }> }
) {
  const { optionId } = await params;
  if (!(await requireUser())) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const rows = await query(
      `SELECT t.traveler_id, t.traveler_name, t.is_active
       FROM flight_option_travelers ot
       JOIN trip_travelers t ON t.traveler_id = ot.traveler_id
       WHERE ot.flight_option_id = ?
       ORDER BY t.traveler_name`,
      [optionId]
    );
    return NextResponse.json({ travelers: rows });
  } catch (err) {
    console.error('List option travelers failed:', err);
    return NextResponse.json({ error: 'Failed to load' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ tripId: string; optionId: string }> }
) {
  const { optionId } = await params;
  if (!(await requireUser())) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  try {
    const { traveler_ids } = await request.json();
    if (!Array.isArray(traveler_ids)) {
      return NextResponse.json({ error: 'traveler_ids must be an array' }, { status: 400 });
    }
    await withTransaction(async (tx) => {
      await queryTx(tx, 'DELETE FROM flight_option_travelers WHERE flight_option_id = ?', [optionId]);
      for (const tid of traveler_ids) {
        await queryTx(tx, 'INSERT INTO flight_option_travelers (flight_option_id, traveler_id) VALUES (?, ?)', [optionId, tid]);
      }
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Update option travelers failed:', err);
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  }
}