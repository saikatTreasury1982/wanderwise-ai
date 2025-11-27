import { NextResponse } from 'next/server';
import { getAllRelationships } from '@/lib/services/relationship-service';

export async function GET() {
  try {
    const relationships = await getAllRelationships();
    return NextResponse.json({ relationships });
  } catch (error) {
    console.error('Error fetching relationships:', error);
    return NextResponse.json(
      { error: 'Failed to fetch relationships' },
      { status: 500 }
    );
  }
}