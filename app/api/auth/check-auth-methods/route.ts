import { NextResponse } from 'next/server';
import { getUserByEmail } from '@/app/lib/services/user-service';
import { getUserPasskeys } from '@/app/lib/services/passkey-service';
import { userHasPassword } from '@/app/lib/services/password-service';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    const user = await getUserByEmail(email);
    
    if (!user) {
      return NextResponse.json({
        hasPasskey: false,
        hasPassword: false,
      });
    }

    const passkeys = await getUserPasskeys(user.user_id);
    const hasPassword = await userHasPassword(user.user_id);

    return NextResponse.json({
      hasPasskey: passkeys.length > 0,
      hasPassword,
    });
  } catch (error) {
    console.error('Error checking auth methods:', error);
    return NextResponse.json(
      { error: 'Failed to check authentication methods' },
      { status: 500 }
    );
  }
}