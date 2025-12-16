import { query } from '@/app/lib/db';

interface Trip {
  trip_id: number;
  user_id: string;
  trip_name: string;
  trip_description: string | null;
  destination_country: string | null;
  destination_city: string | null;
  start_date: string;
  end_date: string;
  status_code: number;
  created_at: string;
  updated_at: string;
}

interface CreateTripInput {
  user_id: string;
  trip_name: string;
  trip_description?: string | null;
  destination_country?: string | null;
  destination_city?: string | null;
  start_date: string;
  end_date: string;
  status_code?: number;
}

interface UpdateTripInput {
  trip_name?: string;
  trip_description?: string | null;
  destination_country?: string | null;
  destination_city?: string | null;
  start_date?: string;
  end_date?: string;
  status_code?: number;
}

export async function createTrip(input: CreateTripInput): Promise<Trip> {
  try {
    await query(
      `INSERT INTO trips (
        user_id, trip_name, trip_description, destination_country, 
        destination_city, start_date, end_date, status_code
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.user_id,
        input.trip_name,
        input.trip_description || null,
        input.destination_country || null,
        input.destination_city || null,
        input.start_date,
        input.end_date,
        input.status_code || 1, // ADD THIS LINE - default to 1 if not provided
      ]
    );

    // Fetch the created trip
    const trips = await query<Trip>(
      'SELECT * FROM trips WHERE user_id = ? ORDER BY trip_id DESC LIMIT 1',
      [input.user_id]
    );

    if (trips.length === 0) {
      throw new Error('Trip creation failed');
    }

    return trips[0];
  } catch (error) {
    console.error('Error creating trip:', error);
    throw error;
  }
}

export async function getTripsByUserId(userId: string): Promise<Trip[]> {
  try {
    return await query<Trip>(
      `SELECT * FROM trips 
       WHERE user_id = ? 
       ORDER BY start_date DESC, created_at DESC`,
      [userId]
    );
  } catch (error) {
    console.error('Error fetching trips:', error);
    throw error;
  }
}

export async function getTripById(tripId: number, userId: string): Promise<Trip | null> {
  try {
    const trips = await query<Trip>(
      'SELECT * FROM trips WHERE trip_id = ? AND user_id = ?',
      [tripId, userId]
    );
    return trips.length > 0 ? trips[0] : null;
  } catch (error) {
    console.error('Error fetching trip:', error);
    throw error;
  }
}

export async function updateTrip(
  tripId: number,
  userId: string,
  input: UpdateTripInput
): Promise<Trip | null> {
  try {
    // Build dynamic update query
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.trip_name !== undefined) {
      updates.push('trip_name = ?');
      values.push(input.trip_name);
    }
    if (input.trip_description !== undefined) {
      updates.push('trip_description = ?');
      values.push(input.trip_description);
    }
    if (input.destination_country !== undefined) {
      updates.push('destination_country = ?');
      values.push(input.destination_country);
    }
    if (input.destination_city !== undefined) {
      updates.push('destination_city = ?');
      values.push(input.destination_city);
    }
    if (input.start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(input.start_date);
    }
    if (input.end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(input.end_date);
    }
    if (input.status_code !== undefined) {
      updates.push('status_code = ?');
      values.push(input.status_code);
    }

    if (updates.length === 0) {
      return await getTripById(tripId, userId);
    }

    updates.push("updated_at = datetime('now')");
    values.push(tripId, userId);

    await query(
      `UPDATE trips SET ${updates.join(', ')} WHERE trip_id = ? AND user_id = ?`,
      values
    );

    return await getTripById(tripId, userId);
  } catch (error) {
    console.error('Error updating trip:', error);
    throw error;
  }
}

export async function deleteTrip(tripId: number, userId: string): Promise<boolean> {
  try {
    // Only allow deletion of draft trips
    const trip = await getTripById(tripId, userId);
    
    if (!trip) {
      throw new Error('Trip not found');
    }
    
    if (trip.status_code !== 1) {
      throw new Error('Only draft trips can be deleted');
    }

    await query(
      'DELETE FROM trips WHERE trip_id = ? AND user_id = ?',
      [tripId, userId]
    );

    return true;
  } catch (error) {
    console.error('Error deleting trip:', error);
    throw error;
  }
}

export async function deleteTripPlanningData(tripId: number): Promise<void> {
  try {
    // Get all tables that need data deletion from trip_functions
    const tables = await query<{ table_name: string; delete_on_drop: number }>(
      'SELECT table_name, delete_on_drop FROM trip_functions WHERE delete_on_drop = 1'
    );

    // Delete data from each table
    for (const table of tables) {
      try {
        await query(
          `DELETE FROM ${table.table_name} WHERE trip_id = ?`,
          [tripId]
        );
      } catch (err) {
        // Table might not exist yet, continue with others
        console.warn(`Could not delete from ${table.table_name}:`, err);
      }
    }
  } catch (error) {
    console.error('Error deleting trip planning data:', error);
    throw error;
  }
}