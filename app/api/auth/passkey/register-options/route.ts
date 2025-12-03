import { NextResponse } from 'next/server';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getUserById, getUserByEmail } from '@/app/lib/services/user-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, email } = body;

    if (!userId && !email) {
      return NextResponse.json(
        { error: 'User ID or email is required' },
        { status: 400 }
      );
    }

    // Fetch user from database
    let user;
    if (userId) {
      user = await getUserById(userId);
    } else {
      user = await getUserByEmail(email);
    }

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const rpName = process.env.NEXT_PUBLIC_RP_NAME;
    const rpID = process.env.NEXT_PUBLIC_RP_ID;

    if (!rpName) {
      throw new Error('NEXT_PUBLIC_RP_NAME environment variable is not set');
    }

    if (!rpID) {
      throw new Error('NEXT_PUBLIC_RP_ID environment variable is not set');
    }

    // Generate registration options
    const options = await generateRegistrationOptions({
      rpName,
      rpID,
      userID: new TextEncoder().encode(user.user_id),
      userName: user.email,
      userDisplayName: `${user.first_name} ${user.last_name}`,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'preferred',
        userVerification: 'preferred',
        authenticatorAttachment: 'platform',
      },
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating registration options:', error);
    return NextResponse.json(
      { error: 'Failed to generate registration options' },
      { status: 500 }
    );
  }
}