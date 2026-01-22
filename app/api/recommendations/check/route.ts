import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { RecommendationFactory } from '@/app/lib/services/recommendation/recommendation-factory';
import { createClient } from '@libsql/client';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    console.log('=== RECOMMENDATION CHECK API ===');
    console.log('Session token exists:', !!sessionToken);

    if (!sessionToken) {
      console.error('No session token found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      console.error('Invalid session');
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    console.log('User ID from session:', session.user_id);

    // Get tripId from query params
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    console.log('Trip ID from query:', tripId);

    if (!tripId) {
      console.error('No trip ID provided');
      return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
    }

    // Database connection
    const databaseUrl = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!databaseUrl || !authToken) {
      console.error('Database configuration missing');
      throw new Error('Database configuration missing');
    }

    const db = createClient({
      url: databaseUrl,
      authToken: authToken,
    });

    // Verify trip belongs to user
    console.log('Verifying trip ownership...');
    const tripResult = await db.execute({
      sql: 'SELECT trip_id FROM trips WHERE trip_id = ? AND user_id = ?',
      args: [parseInt(tripId), session.user_id],
    });

    console.log('Trip ownership result rows:', tripResult.rows.length);

    if (tripResult.rows.length === 0) {
      console.error('Trip not found or does not belong to user');
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get recommendations availability
    console.log('Checking recommendations availability...');
    const recommender = RecommendationFactory.create();
    const availability = await recommender.checkAvailability(parseInt(tripId), session.user_id);

    console.log('Availability result:', JSON.stringify(availability, null, 2));

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error checking recommendation availability:', error);
    return NextResponse.json(
      { error: 'Failed to check recommendations' },
      { status: 500 }
    );
  }
}