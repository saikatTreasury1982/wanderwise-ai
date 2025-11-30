import { NextRequest, NextResponse } from 'next/server';
import {
  getAccommodationOptionById,
  updateAccommodationOption,
  deleteAccommodationOption,
  duplicateAccommodationOption,
} from '@/lib/services/accommodation-options';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; accommodationId: string }> }
) {
  try {
    const { accommodationId } = await params;
    const accommodation = await getAccommodationOptionById(Number(accommodationId));
    if (!accommodation) {
      return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 });
    }
    return NextResponse.json(accommodation);
  } catch (error) {
    console.error('Error fetching accommodation:', error);
    return NextResponse.json({ error: 'Failed to fetch accommodation' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; accommodationId: string }> }
) {
  try {
    const { accommodationId } = await params;
    const body = await request.json();
    const accommodation = await updateAccommodationOption(Number(accommodationId), body);
    if (!accommodation) {
      return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 });
    }
    return NextResponse.json(accommodation);
  } catch (error: any) {
    console.error('Error updating accommodation:', error);
    if (error.message?.includes('overlapping dates')) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to update accommodation' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; accommodationId: string }> }
) {
  try {
    const { accommodationId } = await params;
    const success = await deleteAccommodationOption(Number(accommodationId));
    if (!success) {
      return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting accommodation:', error);
    return NextResponse.json({ error: 'Failed to delete accommodation' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; accommodationId: string }> }
) {
  try {
    const { accommodationId } = await params;
    const accommodation = await duplicateAccommodationOption(Number(accommodationId));
    if (!accommodation) {
      return NextResponse.json({ error: 'Accommodation not found' }, { status: 404 });
    }
    return NextResponse.json(accommodation, { status: 201 });
  } catch (error) {
    console.error('Error duplicating accommodation:', error);
    return NextResponse.json({ error: 'Failed to duplicate accommodation' }, { status: 500 });
  }
}