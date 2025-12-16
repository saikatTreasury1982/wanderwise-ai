import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/app/lib/services/user-service';
import { verifyPassword } from '@/app/lib/services/password-service';
import { createSession } from '@/app/lib/services/session-service';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Get user
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(user.user_id, password);
    if (!isValid) {
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 }
      );
    }

    // Create session (use null for credential_id since password login doesn't use passkey)
    const sessionToken = await createSession(user.user_id, undefined);

    // Set session cookie
    const response = NextResponse.json({ 
      success: true, 
      userId: user.user_id 
    });

    response.cookies.set('session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Password login error:', error);
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}