import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { createClient } from '@libsql/client';
import { RecommendationFactory } from '@/app/lib/services/recommendation/recommendation-factory';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    
    // Get session
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const userId = session.user_id;

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
      args: [parseInt(tripId), userId],
    });

    if (tripResult.rows.length === 0) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 });
    }

    // Get packing recommendations
    const recommender = RecommendationFactory.create();
    const result = await recommender.getPackingRecommendations(parseInt(tripId), userId);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error getting packing recommendations:', error);
    return NextResponse.json(
      { error: 'Failed to get packing recommendations' },
      { status: 500 }
    );
  }
}