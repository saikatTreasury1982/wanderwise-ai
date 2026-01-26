import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { RecommendationFactory } from '@/app/lib/services/recommendation/recommendation-factory';
import { createClient } from '@libsql/client';

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized: No session token found' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    // Get tripId from query params
    const { searchParams } = new URL(request.url);
    const tripId = searchParams.get('tripId');

    if (!tripId) {
      return NextResponse.json({ error: 'Trip ID required' }, { status: 400 });
    }

    // Database connection
    const databaseUrl = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;

    if (!databaseUrl || !authToken) {
      throw new Error('Database configuration missing');
    }

    const db = createClient({
      url: databaseUrl,
      authToken: authToken,
    });

    // Verify trip belongs to user
    const tripResult = await db.execute({
      sql: 'SELECT trip_id FROM trips WHERE trip_id = ? AND user_id = ?',
      args: [parseInt(tripId), session.user_id],
    });

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get recommendations availability
    const recommender = RecommendationFactory.create();
    const availability = await recommender.checkAvailability(parseInt(tripId), session.user_id);

    return NextResponse.json(availability);
  } catch (error) {
    console.error('Error checking recommendation availability:', error);
    return NextResponse.json(
      { error: 'Failed to check recommendations' },
      { status: 500 }
    );
  }
}