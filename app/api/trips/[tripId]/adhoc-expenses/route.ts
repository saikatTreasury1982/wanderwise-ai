import { NextRequest, NextResponse } from 'next/server';
import { getAdhocExpensesByTrip, createAdhocExpense } from '@/app/lib/services/adhoc-expenses';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const expenses = await getAdhocExpensesByTrip(Number(tripId));
    return NextResponse.json(expenses);
  } catch (error) {
    console.error('Error fetching adhoc expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch adhoc expenses' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const expense = await createAdhocExpense({ ...body, trip_id: Number(tripId) });
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error creating adhoc expense:', error);
    return NextResponse.json({ error: 'Failed to create adhoc expense' }, { status: 500 });
  }
}