import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';
import { deleteDestination } from '@/app/lib/services/destination-service';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; destinationId: string }> }
) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    const { destinationId } = await params;
    await deleteDestination(parseInt(destinationId));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/trips/[tripId]/destinations/[destinationId]:', error);
    return NextResponse.json(
      { error: 'Failed to delete destination' },
      { status: 500 }
    );
  }
}