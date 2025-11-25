import { NextResponse } from 'next/server';
import { verifyRegistrationResponse } from '@simplewebauthn/server';
import { storePasskey } from '@/lib/services/passkey-service';
import { createSession } from '@/lib/services/session-service';
import { getUserById } from '@/lib/services/user-service';

export async function POST(request: Request) {
  try {
    const { userId, credential, challenge } = await request.json();

    if (!userId || !credential) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Fetch user
    const user = await getUserById(userId);
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_ORIGIN;
    const rpID = process.env.NEXT_PUBLIC_RP_ID;

    if (!origin) {
      throw new Error('NEXT_PUBLIC_RP_NAME environment variable is not set');
    }

    if (!rpID) {
      throw new Error('NEXT_PUBLIC_RP_ID environment variable is not set');
    }

    // Verify the registration response
    const verification = await verifyRegistrationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
    });

  if (!verification.verified || !verification.registrationInfo) {
    return NextResponse.json(
      { error: 'Passkey verification failed' },
      { status: 400 }
    );
  }

  // In v13, credential data is nested under registrationInfo.credential
  const { credential: registeredCredential } = verification.registrationInfo;
  const credentialID = registeredCredential.id;
  const credentialPublicKey = registeredCredential.publicKey;
  const counter = registeredCredential.counter;

  // Store passkey in database
  await storePasskey(
    userId,
    Buffer.from(credentialID).toString('base64'),
    Buffer.from(credentialPublicKey).toString('base64'),
    counter,
    'Primary Device'
  );

  // Create session
  const sessionToken = await createSession(
    userId,
    Buffer.from(credentialID).toString('base64')
  );

    // Set session cookie
    const response = NextResponse.json({
      success: true,
      verified: true,
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
    console.error('Error verifying passkey registration:', error);
    return NextResponse.json(
      { error: 'Passkey verification failed' },
      { status: 500 }
    );
  }
}