import { NextRequest, NextResponse } from 'next/server';
import { getAlertTypeByCode, updateAlertType, deleteAlertType } from '@/app/lib/services/alert';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ alertCode: string }> }
) {
  try {
    const { alertCode } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const alertType = await getAlertTypeByCode(session.user_id, alertCode);
    if (!alertType) {
      return NextResponse.json({ error: 'Alert type not found' }, { status: 404 });
    }

    return NextResponse.json(alertType);
  } catch (error) {
    console.error('Error fetching alert type:', error);
    return NextResponse.json({ error: 'Failed to fetch alert type' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ alertCode: string }> }
) {
  try {
    const { alertCode } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const alertType = await updateAlertType(session.user_id, alertCode, body);
    if (!alertType) {
      return NextResponse.json({ error: 'Alert type not found' }, { status: 404 });
    }

    return NextResponse.json(alertType);
  } catch (error) {
    console.error('Error updating alert type:', error);
    return NextResponse.json({ error: 'Failed to update alert type' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ alertCode: string }> }
) {
  try {
    const { alertCode } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const success = await deleteAlertType(session.user_id, alertCode);
    if (!success) {
      return NextResponse.json({ error: 'Alert type not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting alert type:', error);
    return NextResponse.json({ error: 'Failed to delete alert type' }, { status: 500 });
  }
}