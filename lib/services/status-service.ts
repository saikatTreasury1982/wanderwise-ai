import { query } from '@/app/lib/db';

interface TripStatus {
  status_code: number;
  status_name: string;
}

export async function getAllTripStatuses(): Promise<TripStatus[]> {
  try {
    return await query<TripStatus>(
      'SELECT status_code, status_name FROM trip_status ORDER BY status_code'
    );
  } catch (error) {
    console.error('Error fetching trip statuses:', error);
    throw error;
  }
}