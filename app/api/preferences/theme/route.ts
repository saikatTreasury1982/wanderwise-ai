import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { isValidTheme } from '@/app/lib/config/theme';
import { updateUserTheme } from '@/app/lib/services/user-preferences-service';

export async function PATCH(request: Request) {
  try {
    const { theme } = await request.json();

    if (!isValidTheme(theme)) {
      return NextResponse.json({ error: 'Invalid theme' }, { status: 400 });
    }

    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await updateUserTheme(session.user_id, theme);

    return NextResponse.json({ theme });
  } catch (error) {
    console.error('Failed to save theme:', error);
    return NextResponse.json({ error: 'Failed to save theme' }, { status: 500 });
  }
}