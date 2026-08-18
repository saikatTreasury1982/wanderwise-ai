import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { syncActualsWithForecast } from '@/app/lib/services/expense-actuals';

export async function POST(request: NextRequest, { params }: { params: Promise<{ tripId: string }> }) {
  try {
    const { tripId } = await params;
    const cookieStore = await cookies();
    const token = cookieStore.get('session')?.value;
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const session = await getSession(token);
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const result = await syncActualsWithForecast(Number(tripId));
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error syncing actuals:', error);
    return NextResponse.json({ error: 'Failed to sync actuals' }, { status: 500 });
  }
}