import { NextRequest, NextResponse } from 'next/server';
import { duplicateFlightOption } from '@/lib/services/flight-options';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ flightId: string }> }
) {
  try {
    const { flightId } = await params;
    const flight = await duplicateFlightOption(Number(flightId));
    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
    return NextResponse.json(flight, { status: 201 });
  } catch (error) {
    console.error('Error duplicating flight:', error);
    return NextResponse.json({ error: 'Failed to duplicate flight' }, { status: 500 });
  }
}