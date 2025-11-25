import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { closeSession } from '@/lib/services/session-service';

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: true, message: 'No active session' });
    }

    // Close session in database
    await closeSession(sessionToken);

    // Clear the cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Error closing session:', error);
    return NextResponse.json(
      { error: 'Failed to close session' },
      { status: 500 }
    );
  }
}