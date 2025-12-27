interface GeocodingResult {
  latitude: number;
  longitude: number;
  name: string;
  country: string;
}

interface WeatherData {
  tempMin: number;
  tempMax: number;
  precipitationChance: number;
  description: string;
}

async function fetchWithRetry(url: string, retries = 3): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (response.ok) return response;
      
      if (response.status === 404 || response.status === 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
  throw new Error('All retries failed');
}

export async function geocodeCity(cityName: string): Promise<GeocodingResult | null> {
  try {
    const response = await fetchWithRetry(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
    );

    if (!response) return null;

    const data = await response.json();

    if (!data.results || data.results.length === 0) return null;

    const result = data.results[0];
    return {
      latitude: result.latitude,
      longitude: result.longitude,
      name: result.name,
      country: result.country,
    };
  } catch (error) {
    console.error('Geocoding error:', error);
    return null;
  }
}

export async function getHistoricalWeather(
  latitude: number,
  longitude: number,
  startDate: string,
  endDate: string
): Promise<WeatherData | null> {
  try {
    // Get last year's data for the same dates
    const lastYearStart = getLastYearDate(startDate);
    const lastYearEnd = getLastYearDate(endDate);

    const response = await fetchWithRetry(
        `https://archive-api.open-meteo.com/v1/archive?latitude=${latitude}&longitude=${longitude}&start_date=${lastYearStart}&end_date=${lastYearEnd}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`
        );

        if (!response) return null;

    const data = await response.json();

    if (!data.daily || !data.daily.temperature_2m_max) return null;

    // Calculate averages
    const maxTemps = data.daily.temperature_2m_max.filter((t: number | null) => t !== null);
    const minTemps = data.daily.temperature_2m_min.filter((t: number | null) => t !== null);
    const precip = data.daily.precipitation_sum.filter((p: number | null) => p !== null);

    if (maxTemps.length === 0 || minTemps.length === 0) return null;

    const avgMax = Math.round(maxTemps.reduce((a: number, b: number) => a + b, 0) / maxTemps.length);
    const avgMin = Math.round(minTemps.reduce((a: number, b: number) => a + b, 0) / minTemps.length);
    
    // Calculate precipitation days percentage
    const precipDays = precip.filter((p: number) => p > 1).length;
    const precipChance = Math.round((precipDays / precip.length) * 100);

    const description = getWeatherDescription(avgMin, avgMax, precipChance);

    return {
      tempMin: avgMin,
      tempMax: avgMax,
      precipitationChance: precipChance,
      description,
    };
  } catch (error) {
    console.error('Weather fetch error:', error);
    return null;
  }
}

function getLastYearDate(dateStr: string): string {
  const date = new Date(dateStr);
  date.setFullYear(date.getFullYear() - 1);
  return date.toISOString().split('T')[0];
}

function getWeatherDescription(minTemp: number, maxTemp: number, precipChance: number): string {
  let tempDesc = '';
  const avgTemp = (minTemp + maxTemp) / 2;

  if (avgTemp < 0) tempDesc = 'Freezing';
  else if (avgTemp < 10) tempDesc = 'Cold';
  else if (avgTemp < 18) tempDesc = 'Cool';
  else if (avgTemp < 25) tempDesc = 'Pleasant';
  else if (avgTemp < 32) tempDesc = 'Warm';
  else tempDesc = 'Hot';

  if (precipChance > 50) tempDesc += ', Rainy';
  else if (precipChance > 30) tempDesc += ', Some rain';

  return tempDesc;
}

export async function getTripWeather(
  city: string,
  startDate: string,
  endDate: string
): Promise<WeatherData | null> {
  const geo = await geocodeCity(city);
  if (!geo) return null;

  return getHistoricalWeather(geo.latitude, geo.longitude, startDate, endDate);
}