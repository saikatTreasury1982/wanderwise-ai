import { NextRequest, NextResponse } from 'next/server';
import {
  getPackingCategoryById,
  updatePackingCategory,
  deletePackingCategory,
  createPackingItem,
} from '@/app/lib/services/packing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const category = await getPackingCategoryById(Number(categoryId));
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error fetching category:', error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const body = await request.json();
    const category = await updatePackingCategory(Number(categoryId), body);
    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string; categoryId: string }> }
) {
  try {
    const { categoryId } = await params;
    const success = await deletePackingCategory(Number(categoryId));
    if (!success) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}

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