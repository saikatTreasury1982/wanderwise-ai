import { NextRequest, NextResponse } from 'next/server';
import { getFlightOptionById, updateFlightOption, deleteFlightOption, duplicateFlightOption } from '@/lib/services/flight-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ flightId: string }> }
) {
  try {
    const { flightId } = await params;
    const flight = await getFlightOptionById(Number(flightId));
    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
    return NextResponse.json(flight);
  } catch (error) {
    console.error('Error fetching flight:', error);
    return NextResponse.json({ error: 'Failed to fetch flight' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ flightId: string }> }
) {
  try {
    const { flightId } = await params;
    const body = await request.json();
    const flight = await updateFlightOption(Number(flightId), body);
    if (!flight) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
    return NextResponse.json(flight);
  } catch (error) {
    console.error('Error updating flight:', error);
    return NextResponse.json({ error: 'Failed to update flight' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ flightId: string }> }
) {
  try {
    const { flightId } = await params;
    const success = await deleteFlightOption(Number(flightId));
    if (!success) {
      return NextResponse.json({ error: 'Flight not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting flight:', error);
    return NextResponse.json({ error: 'Failed to delete flight' }, { status: 500 });
  }
}

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