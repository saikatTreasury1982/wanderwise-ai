import { NextResponse } from 'next/server';
import { getAllCurrencies } from '@/app/lib/services/currency-service';

export async function GET() {
  try {
    const currencies = await getAllCurrencies();
    return NextResponse.json({ currencies });
  } catch (error) {
    console.error('Error fetching currencies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch currencies' },
      { status: 500 }
    );
  }
}