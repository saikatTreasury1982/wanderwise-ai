import { NextResponse } from 'next/server';
import { getTripNoteTypes } from '@/lib/services/trip-notes';

export async function GET() {
  try {
    const types = await getTripNoteTypes();
    return NextResponse.json(types);
  } catch (error) {
    console.error('Error fetching trip note types:', error);
    return NextResponse.json({ error: 'Failed to fetch trip note types' }, { status: 500 });
  }
}