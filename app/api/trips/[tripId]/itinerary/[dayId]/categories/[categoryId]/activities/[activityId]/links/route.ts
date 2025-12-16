import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { query } from '@/app/lib/db';

interface ActivityLink {
  link_id: number;
  activity_id: number;
  link_url: string;
  link_description: string | null;
  display_order: number;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ tripId: string; activityId: string }> }
) {
  try {
    const { tripId, activityId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const links = await query<ActivityLink>(
      'SELECT * FROM activity_links WHERE activity_id = ? ORDER BY display_order ASC',
      [parseInt(activityId)]
    );

    return NextResponse.json({ links });
  } catch (error) {
    console.error('Error fetching activity links:', error);
    return NextResponse.json({ error: 'Failed to fetch links' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tripId: string; activityId: string }> }
) {
  try {
    const { tripId, activityId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    const body = await request.json();
    const { link_url, link_description, display_order } = body;

    if (!link_url) {
      return NextResponse.json({ error: 'Link URL is required' }, { status: 400 });
    }

    await query(
      'INSERT INTO activity_links (activity_id, link_url, link_description, display_order) VALUES (?, ?, ?, ?)',
      [parseInt(activityId), link_url, link_description || null, display_order || 0]
    );

    const links = await query<ActivityLink>(
      'SELECT * FROM activity_links WHERE activity_id = ? ORDER BY display_order ASC',
      [parseInt(activityId)]
    );

    return NextResponse.json({ links: links[links.length - 1] }, { status: 201 });
  } catch (error) {
    console.error('Error creating activity link:', error);
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 });
  }
}