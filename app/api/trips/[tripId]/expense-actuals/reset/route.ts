import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';
import { resetActuals } from '@/app/lib/services/expense-actuals';

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

    const deletedCount = await resetActuals(Number(tripId));

    return NextResponse.json({ 
      success: true, 
      deleted_count: deletedCount,
      message: `Reset complete. Deleted ${deletedCount} actual expense records. You can now transfer the forecast again.`
    });
  } catch (error) {
    console.error('Error resetting actuals:', error);
    return NextResponse.json({ error: 'Failed to reset actuals' }, { status: 500 });
  }
}