import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';
import { transferForecastToActuals } from '@/app/lib/services/expense-actuals';

export async function POST(
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

    const transferredCount = await transferForecastToActuals(Number(tripId));

    return NextResponse.json({ 
      success: true, 
      transferred_count: transferredCount,
      message: `Transferred ${transferredCount} expense items to actuals`
    });
  } catch (error) {
    console.error('Error transferring forecast to actuals:', error);
    return NextResponse.json({ error: 'Failed to transfer forecast' }, { status: 500 });
  }
}