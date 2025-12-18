import { NextRequest, NextResponse } from 'next/server';
import { createPackingItem } from '@/app/lib/services/packing';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const body = await request.json();
    const item = await createPackingItem({ ...body, category_id: Number(categoryId) });
    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    console.error('Error creating packing item:', error);
    return NextResponse.json({ error: 'Failed to create item' }, { status: 500 });
  }
}