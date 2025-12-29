import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';
import { 
  getPaymentMethodById, 
  updatePaymentMethod, 
  deletePaymentMethod 
} from '@/app/lib/services/payment-methods';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ methodId: string }> }
) {
  try {
    const { methodId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const method = await getPaymentMethodById(Number(methodId));
    if (!method) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Verify ownership
    if (method.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json(method);
  } catch (error) {
    console.error('Error fetching payment method:', error);
    return NextResponse.json({ error: 'Failed to fetch payment method' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ methodId: string }> }
) {
  try {
    const { methodId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await getPaymentMethodById(Number(methodId));
    if (!existing) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Verify ownership
    if (existing.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const method = await updatePaymentMethod(Number(methodId), body);

    return NextResponse.json(method);
  } catch (error) {
    console.error('Error updating payment method:', error);
    return NextResponse.json({ error: 'Failed to update payment method' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ methodId: string }> }
) {
  try {
    const { methodId } = await params;
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;

    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const existing = await getPaymentMethodById(Number(methodId));
    if (!existing) {
      return NextResponse.json({ error: 'Payment method not found' }, { status: 404 });
    }

    // Verify ownership
    if (existing.user_id !== session.user_id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await deletePaymentMethod(Number(methodId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting payment method:', error);
    return NextResponse.json({ error: 'Failed to delete payment method' }, { status: 500 });
  }
}