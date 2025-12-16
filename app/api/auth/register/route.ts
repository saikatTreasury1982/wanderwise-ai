import { NextResponse } from 'next/server';
import { createUser } from '@/app/lib/services/user-service';
import { createPassword } from '@/app/lib/services/password-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, firstName, middleName, lastName, residentCountry, homeCurrency, authMethod, password } = body;

    // Validate input
    if (!email || !firstName || !lastName || !residentCountry || !homeCurrency) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Create user in database
    const user = await createUser({
      email,
      firstName,
      middleName: middleName || null,
      lastName,
      residentCountry,
      homeCurrency,
    });

    // If password auth method selected, create password
    if (authMethod === 'password' && password) {
      await createPassword(user.user_id, password);
    }

    return NextResponse.json({
      success: true,
      userId: user.user_id,
      email: user.email,
      requiresPasskey: authMethod === 'passkey',
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    
    if (error.message === 'Email already registered') {
      return NextResponse.json(
        { error: 'This email is already registered' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Registration failed. Please try again.' },
      { status: 500 }
    );
  }
}