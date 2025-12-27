import { query } from '@/app/lib/db';
import type { TripDestination, CreateDestinationInput } from '@/app/lib/types/destination';

export async function getDestinationsByTrip(tripId: number): Promise<TripDestination[]> {
  try {
    const destinations = await query<TripDestination>(
      `SELECT * FROM trip_destinations WHERE trip_id = ? ORDER BY display_order`,
      [tripId]
    );
    return destinations;
  } catch (error) {
    console.error('Error fetching destinations:', error);
    throw error;
  }
}

export async function createDestination(input: CreateDestinationInput): Promise<TripDestination> {
  try {
    // Get the next display_order
    const maxOrder = await query<{ max_order: number | null }>(
      `SELECT MAX(display_order) as max_order FROM trip_destinations WHERE trip_id = ?`,
      [input.trip_id]
    );
    
    const nextOrder = (maxOrder[0]?.max_order ?? -1) + 1;

    await query(
      `INSERT INTO trip_destinations (trip_id, country, city, display_order) VALUES (?, ?, ?, ?)`,
      [input.trip_id, input.country, input.city || null, input.display_order ?? nextOrder]
    );

    const destinations = await query<TripDestination>(
      `SELECT * FROM trip_destinations WHERE trip_id = ? ORDER BY destination_id DESC LIMIT 1`,
      [input.trip_id]
    );

    if (destinations.length === 0) {
      throw new Error('Destination creation failed');
    }

    return destinations[0];
  } catch (error) {
    console.error('Error creating destination:', error);
    throw error;
  }
}

export async function deleteDestination(destinationId: number): Promise<void> {
  try {
    await query(
      `DELETE FROM trip_destinations WHERE destination_id = ?`,
      [destinationId]
    );
  } catch (error) {
    console.error('Error deleting destination:', error);
    throw error;
  }
}

export async function reorderDestinations(
  tripId: number,
  orders: Array<{ destination_id: number; display_order: number }>
): Promise<void> {
  try {
    for (const order of orders) {
      await query(
        `UPDATE trip_destinations SET display_order = ? WHERE destination_id = ? AND trip_id = ?`,
        [order.display_order, order.destination_id, tripId]
      );
    }
  } catch (error) {
    console.error('Error reordering destinations:', error);
    throw error;
  }
}