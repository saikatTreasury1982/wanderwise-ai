import { NextResponse } from 'next/server';
import { searchAirports } from '@/app/lib/airports';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') ?? '';

  if (q.trim().length < 2) {
    return NextResponse.json({ airports: [] });
  }

  try {
    const airports = await searchAirports(q, 10);
    return NextResponse.json({ airports });
  } catch (err) {
    console.error('Airport search failed:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}