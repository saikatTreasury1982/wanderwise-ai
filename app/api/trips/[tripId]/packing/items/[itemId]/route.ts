import { NextRequest, NextResponse } from 'next/server';
import {
  getPackingItemById,
  updatePackingItem,
  deletePackingItem,
  togglePackingItem,
} from '@/lib/services/packing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const item = await getPackingItemById(Number(itemId));
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error fetching item:', error);
    return NextResponse.json({ error: 'Failed to fetch item' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const body = await request.json();
    const item = await updatePackingItem(Number(itemId), body);
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error updating item:', error);
    return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const success = await deletePackingItem(Number(itemId));
    if (!success) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting item:', error);
    return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; itemId: string }> }
) {
  try {
    const { itemId } = await params;
    const item = await togglePackingItem(Number(itemId));
    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    console.error('Error toggling item:', error);
    return NextResponse.json({ error: 'Failed to toggle item' }, { status: 500 });
  }
}