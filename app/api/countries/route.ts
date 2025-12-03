import { NextResponse } from 'next/server';
import { query } from '@/app/lib/db';

interface Country {
  country_code: string;
  country_name: string;
  currency_code: string;
}

export async function GET() {
  try {
    // Query active countries from database
    const countries = await query<Country>(
      `SELECT country_code, country_name, currency_code 
       FROM countries 
       WHERE is_active = 1 
       ORDER BY country_name ASC`
    );

    return NextResponse.json({ countries });
  } catch (error) {
    console.error('Error fetching countries:', error);
    return NextResponse.json(
      { error: 'Failed to fetch countries from database' },
      { status: 500 }
    );
  }
}