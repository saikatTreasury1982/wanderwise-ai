import { NextRequest, NextResponse } from 'next/server';
import { getTripAlertSettings, setTripAlertSetting, deleteTripAlertSetting } from '@/app/lib/services/alert';
import { getAlertTypesByUser } from '@/app/lib/services/alert';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

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

    const settings = await getTripAlertSettings(Number(tripId), session.user_id);
    const alertTypes = await getAlertTypesByUser(session.user_id);

    return NextResponse.json({ settings, alertTypes });
  } catch (error) {
    console.error('Error fetching trip alert settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

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

    const body = await request.json();
    const { alert_code, alert_days } = body;

    const setting = await setTripAlertSetting(Number(tripId), session.user_id, alert_code, alert_days);
    return NextResponse.json(setting, { status: 201 });
  } catch (error) {
    console.error('Error setting trip alert:', error);
    return NextResponse.json({ error: 'Failed to set alert' }, { status: 500 });
  }
}

export async function DELETE(
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

    const { searchParams } = new URL(request.url);
    const alertCode = searchParams.get('alert_code');

    if (!alertCode) {
      return NextResponse.json({ error: 'Missing alert_code' }, { status: 400 });
    }

    await deleteTripAlertSetting(Number(tripId), session.user_id, alertCode);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting trip alert:', error);
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 });
  }
}