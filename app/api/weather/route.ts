import { NextRequest, NextResponse } from 'next/server';
import { getTripWeather } from '@/app/lib/services/weather';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get('city');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!city || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    const weather = await getTripWeather(city, startDate, endDate);
    return NextResponse.json(weather);
  } catch (error: any) {
    console.error('Weather API error:', error.message || error);
    
    // Return 503 Service Unavailable for timeout/network errors
    // This tells the client weather is temporarily unavailable
    if (error.name === 'AbortError' || error.code === 'ETIMEDOUT') {
      return NextResponse.json(
        { error: 'Weather service temporarily unavailable' },
        { status: 503 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch weather data' },
      { status: 500 }
    );
  }
}