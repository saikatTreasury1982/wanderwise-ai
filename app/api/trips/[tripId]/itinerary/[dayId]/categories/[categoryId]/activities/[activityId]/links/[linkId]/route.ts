import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';
import { query } from '@/app/lib/db';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Invalid session' }, { status: 401 });
    }

    await query('DELETE FROM activity_links WHERE link_id = ?', [parseInt(linkId)]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting activity link:', error);
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ linkId: string }> }
) {
  try {
    const { linkId } = await params;
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
    const { link_url, link_description } = body;

    await query(
      'UPDATE activity_links SET link_url = ?, link_description = ? WHERE link_id = ?',
      [link_url, link_description || null, parseInt(linkId)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating activity link:', error);
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 });
  }
}