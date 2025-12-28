import { NextRequest, NextResponse } from 'next/server';
import { getAdhocExpenseById, updateAdhocExpense, deleteAdhocExpense, duplicateAdhocExpense } from '@/app/lib/services/adhoc-expenses';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const { expenseId } = await params;
    const expense = await getAdhocExpenseById(Number(expenseId));
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error fetching adhoc expense:', error);
    return NextResponse.json({ error: 'Failed to fetch adhoc expense' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const { expenseId } = await params;
    const body = await request.json();
    const expense = await updateAdhocExpense(Number(expenseId), body);
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json(expense);
  } catch (error) {
    console.error('Error updating adhoc expense:', error);
    return NextResponse.json({ error: 'Failed to update adhoc expense' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const { expenseId } = await params;
    const success = await deleteAdhocExpense(Number(expenseId));
    if (!success) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting adhoc expense:', error);
    return NextResponse.json({ error: 'Failed to delete adhoc expense' }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ expenseId: string }> }
) {
  try {
    const { expenseId } = await params;
    const expense = await duplicateAdhocExpense(Number(expenseId));
    if (!expense) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 });
    }
    return NextResponse.json(expense, { status: 201 });
  } catch (error) {
    console.error('Error duplicating adhoc expense:', error);
    return NextResponse.json({ error: 'Failed to duplicate adhoc expense' }, { status: 500 });
  }
}