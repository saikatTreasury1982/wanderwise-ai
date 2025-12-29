import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';
import { getSettlementSummary } from '@/app/lib/services/expense-actuals';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const summary = await getSettlementSummary(Number(tripId));

    return NextResponse.json(summary);
  } catch (error) {
    console.error('Error fetching settlement summary:', error);
    return NextResponse.json({ error: 'Failed to fetch settlement summary' }, { status: 500 });
  }
}