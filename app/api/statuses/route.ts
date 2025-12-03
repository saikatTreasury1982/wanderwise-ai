import { NextResponse } from 'next/server';
import { getAllTripStatuses } from '@/app/lib/services/status-service';

export async function GET() {
  try {
    const statuses = await getAllTripStatuses();
    return NextResponse.json({ statuses });
  } catch (error) {
    console.error('Error fetching statuses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch statuses' },
      { status: 500 }
    );
  }
}