import { NextResponse } from 'next/server';
import { getPasswordPattern } from '@/app/lib/services/password-service';

export async function GET() {
  try {
    const pattern = await getPasswordPattern();
    
    if (!pattern) {
      return NextResponse.json(
        { error: 'Password requirements not configured' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      description: pattern.description,
      minLength: pattern.min_length,
      requireUppercase: pattern.require_uppercase,
      requireNumbers: pattern.require_numbers,
    });
  } catch (error) {
    console.error('Error fetching password requirements:', error);
    return NextResponse.json(
      { error: 'Failed to fetch requirements' },
      { status: 500 }
    );
  }
}