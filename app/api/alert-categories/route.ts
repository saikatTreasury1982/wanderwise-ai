import { NextResponse } from 'next/server';
import { getAlertCategories } from '@/app/lib/services/alert';

export async function GET() {
  try {
    const categories = await getAlertCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching alert categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}