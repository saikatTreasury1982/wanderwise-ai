import { NextRequest, NextResponse } from 'next/server';
import { getItineraryCategoriesByRange, createItineraryCategory } from '@/app/lib/services/itinerary';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  if (!token) return null;
  return getSession(token);
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ tripId: string; rangeId: string }> }) {
  try {
    const { rangeId } = await params;
    if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const categories = await getItineraryCategoriesByRange(Number(rangeId));
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching range categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ tripId: string; rangeId: string }> }) {
  try {
    const { rangeId } = await params;
    if (!(await auth())) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await request.json();
    const category = await createItineraryCategory({
      day_range_id: Number(rangeId),
      category_name: body.category_name,
      category_cost: body.category_cost,
      currency_code: body.currency_code,
    });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating range category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}