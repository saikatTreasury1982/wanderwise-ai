import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/app/lib/services/user-service';
import { createPassword, userHasPassword } from '@/app/lib/services/password-service';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Check if user already has a password
    const hasPassword = await userHasPassword(user.user_id);
    if (hasPassword) {
      return NextResponse.json(
        { error: 'Password already exists for this user' },
        { status: 409 }
      );
    }

    await createPassword(user.user_id, password);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Password creation error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create password' },
      { status: 500 }
    );
  }
}