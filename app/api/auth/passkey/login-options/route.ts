import { NextResponse } from 'next/server';
import { generateAuthenticationOptions, AuthenticatorTransportFuture } from '@simplewebauthn/server';
import { getUserByEmail } from '@/lib/services/user-service';
import { getUserPasskeys } from '@/lib/services/passkey-service';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Fetch user
    const user = await getUserByEmail(email);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Get user's passkeys
    const passkeys = await getUserPasskeys(user.user_id);

    if (passkeys.length === 0) {
      return NextResponse.json(
        { 
          error: 'No passkeys found for this user',
          userId: user.user_id  // Return userId so frontend can create passkey
        },
        { status: 404 }
      );
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID;
    if (!rpID) {
      throw new Error('NEXT_PUBLIC_RP_ID environment variable is not set');
    }

    // Generate authentication options
    const options = await generateAuthenticationOptions({
      rpID,
      allowCredentials: passkeys.map(passkey => ({
        id: passkey.credential_id,
        transports: ['internal', 'hybrid'] as AuthenticatorTransportFuture[],
      })),
      userVerification: 'preferred',
    });

    return NextResponse.json(options);
  } catch (error) {
    console.error('Error generating authentication options:', error);
    return NextResponse.json(
      { error: 'Failed to generate authentication options' },
      { status: 500 }
    );
  }
}