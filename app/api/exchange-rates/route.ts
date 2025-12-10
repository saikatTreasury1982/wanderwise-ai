import { NextRequest, NextResponse } from 'next/server';
import { getExchangeRates } from '@/app/lib/services/exchange-rate';
import { getSession } from '@/app/lib/services/session-service';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session')?.value;
    
    if (!sessionToken) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const session = await getSession(sessionToken);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const base = searchParams.get('base') || 'USD';
    const symbolsParam = searchParams.get('symbols');
    const symbols = symbolsParam ? symbolsParam.split(',').filter(s => s.trim()) : [];

    if (symbols.length === 0) {
      return NextResponse.json({ error: 'No target currencies specified' }, { status: 400 });
    }

    const rates = await getExchangeRates(base, symbols);
    return NextResponse.json(rates);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json({ error: 'Failed to fetch exchange rates' }, { status: 500 });
  }
}