import { NextRequest, NextResponse } from 'next/server';
import { getTripWeather } from '@/app/lib/services/weather';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const city = searchParams.get('city');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!city || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'Missing required parameters: city, startDate, endDate' },
        { status: 400 }
      );
    }

    const weather = await getTripWeather(city, startDate, endDate);

    if (!weather) {
      return NextResponse.json(
        { error: 'Could not fetch weather data' },
        { status: 404 }
      );
    }

    return NextResponse.json(weather);
  } catch (error) {
    console.error('Weather API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch weather' },
      { status: 500 }
    );
  }
}