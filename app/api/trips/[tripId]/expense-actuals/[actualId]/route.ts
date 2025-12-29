import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';
import { getActualById, updateActual } from '@/app/lib/services/expense-actuals';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ actualId: string }> }
) {
  try {
    const { actualId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const actual = await getActualById(Number(actualId));
    
    if (!actual) {
      return NextResponse.json({ error: 'Actual not found' }, { status: 404 });
    }

    return NextResponse.json(actual);
  } catch (error) {
    console.error('Error fetching actual:', error);
    return NextResponse.json({ error: 'Failed to fetch actual' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ actualId: string }> }
) {
  try {
    const { actualId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const actual = await updateActual(Number(actualId), body);

    if (!actual) {
      return NextResponse.json({ error: 'Actual not found' }, { status: 404 });
    }

    return NextResponse.json(actual);
  } catch (error) {
    console.error('Error updating actual:', error);
    return NextResponse.json({ error: 'Failed to update actual' }, { status: 500 });
  }
}