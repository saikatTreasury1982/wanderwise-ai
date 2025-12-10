import { NextRequest, NextResponse } from 'next/server';
import { collectCosts, getCostForecastReport } from '@/app/lib/services/cost-collector';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

// GET - Read existing report from expenses table
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const report = await getCostForecastReport(Number(tripId));
    
    if (!report) {
      return NextResponse.json({ message: 'No cost data collected yet' }, { status: 404 });
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error fetching cost forecast:', error);
    return NextResponse.json({ error: 'Failed to fetch cost forecast' }, { status: 500 });
  }
}

// POST - Collect costs and save to expenses table
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
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
    const statuses = body.statuses || ['confirmed', 'shortlisted'];

    const report = await collectCosts({
      tripId: Number(tripId),
      statuses,
    });

    return NextResponse.json(report);
  } catch (error) {
    console.error('Error collecting costs:', error);
    return NextResponse.json({ error: 'Failed to collect costs' }, { status: 500 });
  }
}