import { NextResponse } from 'next/server';
import { verifyAuthenticationResponse } from '@simplewebauthn/server';
import { getPasskey, updatePasskeyCounter } from '@/lib/services/passkey-service';
import { createSession } from '@/lib/services/session-service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { credential, challenge } = body;

    if (!credential || !challenge) {
      return NextResponse.json(
        { error: 'Missing credential or challenge' },
        { status: 400 }
      );
    }

    // Extract credential ID from the response (it's base64url encoded)
    const credentialId = credential.id;
    
    // Get passkey from database
    const passkey = await getPasskey(credentialId);

    if (!passkey) {
      return NextResponse.json(
        { error: 'Passkey not found' },
        { status: 404 }
      );
    }

    const origin = process.env.NEXT_PUBLIC_ORIGIN;
    if (!origin) {
      throw new Error('NEXT_PUBLIC_ORIGIN environment variable is not set');
    }

    const rpID = process.env.NEXT_PUBLIC_RP_ID;
    if (!rpID) {
      throw new Error('NEXT_PUBLIC_RP_ID environment variable is not set');
    }

    // Convert stored base64 strings to Uint8Array
    const credentialPublicKey = Uint8Array.from(
      Buffer.from(passkey.public_key, 'base64')
    );

    // Verify the authentication response
    const verification = await verifyAuthenticationResponse({
      response: credential,
      expectedChallenge: challenge,
      expectedOrigin: origin,
      expectedRPID: rpID,
      expectedType: 'webauthn.get',
      credential: {
        id: credentialId,
        publicKey: credentialPublicKey,
        counter: passkey.counter,
      },
    });

    if (!verification.verified) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 400 }
      );
    }

    // Update passkey counter
    await updatePasskeyCounter(
      passkey.credential_id,
      verification.authenticationInfo.newCounter
    );

    // Create session
    const sessionToken = await createSession(
      passkey.user_id,
      passkey.credential_id
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
    console.error('Error verifying authentication:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}