import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { getUserPreferences, getDefaultPreferences } from '@/app/lib/services/user-preferences-service';

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      );
    }

    let preferences = await getUserPreferences(session.user_id);

    if (!preferences) {
      // Return defaults if no preferences set
      const defaults = await getDefaultPreferences();
      return NextResponse.json({ preferences: { user_id: session.user_id, ...defaults } });
    }

    return NextResponse.json({ preferences });
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}