import { query } from '@/lib/db';

interface Traveler {
  traveler_id: number;
  trip_id: number;
  traveler_name: string;
  traveler_email: string | null;
  relationship: string | null;
  is_primary: number;
  is_cost_sharer: number;
  traveler_currency: string | null;
  is_active: number;
  created_at: string;
}

interface CreateTravelerInput {
  trip_id: number;
  traveler_name: string;
  traveler_email?: string | null;
  relationship?: string | null;
  is_primary?: boolean;
  is_cost_sharer?: boolean;
  traveler_currency?: string | null;
  is_active?: boolean;
}

interface UpdateTravelerInput {
  traveler_name?: string;
  traveler_email?: string | null;
  relationship?: string | null;
  is_primary?: boolean;
  is_cost_sharer?: boolean;
  traveler_currency?: string | null;
  is_active?: boolean;
}

export async function getTravelersByTripId(tripId: number): Promise<Traveler[]> {
  try {
    return await query<Traveler>(
      `SELECT * FROM trip_travelers 
       WHERE trip_id = ? 
       ORDER BY is_primary DESC, traveler_name ASC`,
      [tripId]
    );
  } catch (error) {
    console.error('Error fetching travelers:', error);
    throw error;
  }
}

export async function getTravelerById(travelerId: number, tripId: number): Promise<Traveler | null> {
  try {
    const travelers = await query<Traveler>(
      'SELECT * FROM trip_travelers WHERE traveler_id = ? AND trip_id = ?',
      [travelerId, tripId]
    );
    return travelers.length > 0 ? travelers[0] : null;
  } catch (error) {
    console.error('Error fetching traveler:', error);
    throw error;
  }
}

export async function createTraveler(input: CreateTravelerInput): Promise<Traveler> {
  try {
    await query(
      `INSERT INTO trip_travelers (
        trip_id, traveler_name, traveler_email, relationship,
        is_primary, is_cost_sharer, traveler_currency, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.trip_id,
        input.traveler_name,
        input.traveler_email || null,
        input.relationship || null,
        input.is_primary ? 1 : 0,
        input.is_cost_sharer ? 1 : 0,
        input.traveler_currency || null,
        input.is_active !== false ? 1 : 0,
      ]
    );

    const travelers = await query<Traveler>(
      'SELECT * FROM trip_travelers WHERE trip_id = ? ORDER BY traveler_id DESC LIMIT 1',
      [input.trip_id]
    );

    if (travelers.length === 0) {
      throw new Error('Traveler creation failed');
    }

    return travelers[0];
  } catch (error) {
    console.error('Error creating traveler:', error);
    throw error;
  }
}

export async function updateTraveler(
  travelerId: number,
  tripId: number,
  input: UpdateTravelerInput
): Promise<Traveler | null> {
  try {
    const updates: string[] = [];
    const values: (string | number | null)[] = [];

    if (input.traveler_name !== undefined) {
      updates.push('traveler_name = ?');
      values.push(input.traveler_name);
    }
    if (input.traveler_email !== undefined) {
      updates.push('traveler_email = ?');
      values.push(input.traveler_email);
    }
    if (input.relationship !== undefined) {
      updates.push('relationship = ?');
      values.push(input.relationship);
    }
    if (input.is_primary !== undefined) {
      updates.push('is_primary = ?');
      values.push(input.is_primary ? 1 : 0);
    }
    if (input.is_cost_sharer !== undefined) {
      updates.push('is_cost_sharer = ?');
      values.push(input.is_cost_sharer ? 1 : 0);
    }
    if (input.traveler_currency !== undefined) {
      updates.push('traveler_currency = ?');
      values.push(input.traveler_currency);
    }
    if (input.is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(input.is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return await getTravelerById(travelerId, tripId);
    }

    values.push(travelerId, tripId);

    await query(
      `UPDATE trip_travelers SET ${updates.join(', ')} WHERE traveler_id = ? AND trip_id = ?`,
      values
    );

    return await getTravelerById(travelerId, tripId);
  } catch (error) {
    console.error('Error updating traveler:', error);
    throw error;
  }
}

export async function deleteTraveler(travelerId: number, tripId: number): Promise<boolean> {
  try {
    const traveler = await getTravelerById(travelerId, tripId);

    if (!traveler) {
      throw new Error('Traveler not found');
    }

    if (traveler.relationship === 'self') {
      throw new Error('Cannot delete the primary trip owner');
    }

    await query(
      'DELETE FROM trip_travelers WHERE traveler_id = ? AND trip_id = ?',
      [travelerId, tripId]
    );

    return true;
  } catch (error) {
    console.error('Error deleting traveler:', error);
    throw error;
  }
}

export async function getTravelersCount(tripId: number): Promise<number> {
  try {
    const result = await query<{ count: number }>(
      'SELECT COUNT(*) as count FROM trip_travelers WHERE trip_id = ?',
      [tripId]
    );
    return result[0]?.count || 0;
  } catch (error) {
    console.error('Error counting travelers:', error);
    throw error;
  }
}