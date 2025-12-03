import { NextRequest, NextResponse } from 'next/server';
import { getPackingCategoriesByTrip, createPackingCategory, getPackingStats } from '@/app/lib/services/packing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const categories = await getPackingCategoriesByTrip(Number(tripId));
    const stats = await getPackingStats(Number(tripId));
    return NextResponse.json({ categories, stats });
  } catch (error) {
    console.error('Error fetching packing list:', error);
    return NextResponse.json({ error: 'Failed to fetch packing list' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const category = await createPackingCategory({ ...body, trip_id: Number(tripId) });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating packing category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}