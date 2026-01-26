import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const country = searchParams.get('country');

    if (!country) {
      return NextResponse.json(
        { success: false, error: 'Country parameter is required' },
        { status: 400 }
      );
    }

    // Validate English alphabets only
    if (!/^[a-zA-Z\s]+$/.test(country)) {
      return NextResponse.json(
        { success: false, error: 'Country name must contain only English letters' },
        { status: 400 }
      );
    }

    // Call restcountries.com API
    const response = await fetch(
      `https://restcountries.com/v3.1/name/${encodeURIComponent(country)}?fullText=false`,
      {
        headers: {
          'Accept': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { success: false, error: 'Country not found. Please check spelling.' },
          { status: 404 }
        );
      }
      throw new Error('Failed to fetch from restcountries API');
    }

    const data = await response.json();

    // API returns array of matches, take first one
    if (data && data.length > 0) {
      const countryData = data[0];
      
      return NextResponse.json({
        success: true,
        code: countryData.cca2, // ISO 3166-1 alpha-2 code (e.g., "JP")
        name: countryData.name.common, // Common name (e.g., "Japan")
        officialName: countryData.name.official, // Official name
      });
    }

    return NextResponse.json(
      { success: false, error: 'Country not found' },
      { status: 404 }
    );

  } catch (error) {
    console.error('Country lookup error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to lookup country. Please try again.' },
      { status: 500 }
    );
  }
}