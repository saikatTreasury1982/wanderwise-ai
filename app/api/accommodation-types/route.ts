import { NextResponse } from 'next/server';
import { getAccommodationTypes } from '@/lib/services/accommodation-options';

export async function GET() {
  try {
    const types = await getAccommodationTypes();
    return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching accommodation types:', error);
    return NextResponse.json({ error: 'Failed to fetch accommodation types' }, { status: 500 });
  }
}