import { query } from '@/app/lib/db';
import type {
  AccommodationType,
  AccommodationOption,
  AccommodationOptionTraveler,
  CreateAccommodationOptionInput,
  UpdateAccommodationOptionInput,
} from '@/app/lib/types/accommodation';

export async function getAccommodationTypes(): Promise<AccommodationType[]> {
  return query<AccommodationType>(`SELECT * FROM accommodation_types ORDER BY type_name`, []);
}

export async function getAccommodationOptionsByTrip(tripId: number): Promise<AccommodationOption[]> {
  // Single query with LEFT JOIN for travelers
  const rows = await query<{
    accommodation_option_id: number;
    trip_id: number;
    type_name: string | null;
    accommodation_name: string | null;
    address: string | null;
    location: string | null;
    check_in_date: string | null;
    check_in_time: string | null;
    check_out_date: string | null;
    check_out_time: string | null;
    num_rooms: number;
    price_per_night: number | null;
    total_price: number | null;
    currency_code: string | null;
    status: string;
    booking_reference: string | null;
    booking_source: string | null;
    notes: string | null;
    created_at: string;
    updated_at: string;
    traveler_link_id: number | null;
    traveler_id: number | null;
    traveler_name: string | null;
    is_cost_sharer: number | null;
  }>(
    `SELECT 
      ao.*,
      aot.id as traveler_link_id,
      aot.traveler_id,
      tt.traveler_name,
      tt.is_cost_sharer
     FROM accommodation_options ao
     LEFT JOIN accommodation_option_travelers aot ON ao.accommodation_option_id = aot.accommodation_option_id
     LEFT JOIN trip_travelers tt ON aot.traveler_id = tt.traveler_id
     WHERE ao.trip_id = ?
     ORDER BY ao.check_in_date, ao.created_at DESC, aot.id`,
    [tripId]
  );

  const accommodationMap = new Map<number, AccommodationOption>();

  for (const row of rows) {
    if (!accommodationMap.has(row.accommodation_option_id)) {
      accommodationMap.set(row.accommodation_option_id, {
        accommodation_option_id: row.accommodation_option_id,
        trip_id: row.trip_id,
        type_name: row.type_name,
        accommodation_name: row.accommodation_name,
        address: row.address,
        location: row.location,
        check_in_date: row.check_in_date,
        check_in_time: row.check_in_time,
        check_out_date: row.check_out_date,
        check_out_time: row.check_out_time,
        num_rooms: row.num_rooms,
        price_per_night: row.price_per_night,
        total_price: row.total_price,
        currency_code: row.currency_code,
        status: row.status as 'draft' | 'shortlisted' | 'confirmed' | 'not_selected',
        booking_reference: row.booking_reference,
        booking_source: row.booking_source,
        notes: row.notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
        travelers: [],
      });
    }

    if (row.traveler_id) {
      accommodationMap.get(row.accommodation_option_id)!.travelers!.push({
        id: row.traveler_link_id!,
        accommodation_option_id: row.accommodation_option_id,
        traveler_id: row.traveler_id,
        traveler_name: row.traveler_name!,
        is_cost_sharer: row.is_cost_sharer ?? 1,
      });
    }
  }

  return Array.from(accommodationMap.values());
}

export async function getAccommodationOptionById(accommodationOptionId: number): Promise<AccommodationOption | null> {
  const rows = await query<AccommodationOption>(
    `SELECT * FROM accommodation_options WHERE accommodation_option_id = ?`,
    [accommodationOptionId]
  );

  if (rows.length === 0) return null;

  const travelers = await query<AccommodationOptionTraveler>(
    `SELECT aot.id, aot.accommodation_option_id, aot.traveler_id, tt.traveler_name, tt.is_cost_sharer 
    FROM accommodation_option_travelers aot
    JOIN trip_travelers tt ON aot.traveler_id = tt.traveler_id
    WHERE aot.accommodation_option_id = ?`,
    [accommodationOptionId]
  );

  return {
    ...rows[0],
    travelers,
  };
}

export async function checkDateOverlap(
  tripId: number,
  checkInDate: string,
  checkOutDate: string,
  excludeId?: number
): Promise<boolean> {
  const excludeClause = excludeId ? `AND accommodation_option_id != ?` : '';
  const args = excludeId 
    ? [tripId, checkOutDate, checkInDate, excludeId]
    : [tripId, checkOutDate, checkInDate];

  const overlapping = await query<{ count: number }>(
    `SELECT COUNT(*) as count FROM accommodation_options 
     WHERE trip_id = ? 
     AND status = 'confirmed'
     AND check_in_date < ? 
     AND check_out_date > ?
     ${excludeClause}`,
    args
  );

  return overlapping[0].count > 0;
}

export async function createAccommodationOption(input: CreateAccommodationOptionInput): Promise<AccommodationOption> {
  await query(
    `INSERT INTO accommodation_options (
      trip_id, type_name, accommodation_name, address, location,
      check_in_date, check_in_time, check_out_date, check_out_time,
      num_rooms, price_per_night, total_price, currency_code,
      booking_reference, booking_source, notes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.trip_id,
      input.type_name ?? null,
      input.accommodation_name ?? null,
      input.address ?? null,
      input.location ?? null,
      input.check_in_date ?? null,
      input.check_in_time ?? null,
      input.check_out_date ?? null,
      input.check_out_time ?? null,
      input.num_rooms ?? 1,
      input.price_per_night ?? null,
      input.total_price ?? null,
      input.currency_code ?? null,
      input.booking_reference ?? null,
      input.booking_source ?? null,
      input.notes ?? null,
    ]
  );

  const [{ id: accommodationOptionId }] = await query<{ id: number }>(`SELECT last_insert_rowid() as id`, []);

  if (input.traveler_ids?.length) {
    for (const travelerId of input.traveler_ids) {
      await query(
        `INSERT INTO accommodation_option_travelers (accommodation_option_id, traveler_id) VALUES (?, ?)`,
        [accommodationOptionId, travelerId]
      );
    }
  }

  return (await getAccommodationOptionById(accommodationOptionId))!;
}

export async function updateAccommodationOption(
  accommodationOptionId: number,
  input: UpdateAccommodationOptionInput
): Promise<AccommodationOption | null> {
  const current = await getAccommodationOptionById(accommodationOptionId);
  if (!current) return null;

  // Check for date overlap if setting to confirmed
  if (input.status === 'confirmed') {
    const checkInDate = input.check_in_date ?? current.check_in_date;
    const checkOutDate = input.check_out_date ?? current.check_out_date;
    
    if (checkInDate && checkOutDate) {
      const hasOverlap = await checkDateOverlap(current.trip_id, checkInDate, checkOutDate, accommodationOptionId);
      if (hasOverlap) {
        throw new Error('Cannot confirm: overlapping dates with another confirmed accommodation');
      }
    }
  }

  const updates: string[] = [];
  const args: (string | number | null)[] = [];

  if (input.type_name !== undefined) {
    updates.push('type_name = ?');
    args.push(input.type_name);
  }
  if (input.accommodation_name !== undefined) {
    updates.push('accommodation_name = ?');
    args.push(input.accommodation_name);
  }
  if (input.address !== undefined) {
    updates.push('address = ?');
    args.push(input.address);
  }
  if (input.location !== undefined) {
    updates.push('location = ?');
    args.push(input.location);
  }
  if (input.check_in_date !== undefined) {
    updates.push('check_in_date = ?');
    args.push(input.check_in_date);
  }
  if (input.check_in_time !== undefined) {
    updates.push('check_in_time = ?');
    args.push(input.check_in_time);
  }
  if (input.check_out_date !== undefined) {
    updates.push('check_out_date = ?');
    args.push(input.check_out_date);
  }
  if (input.check_out_time !== undefined) {
    updates.push('check_out_time = ?');
    args.push(input.check_out_time);
  }
  if (input.num_rooms !== undefined) {
    updates.push('num_rooms = ?');
    args.push(input.num_rooms);
  }
  if (input.price_per_night !== undefined) {
    updates.push('price_per_night = ?');
    args.push(input.price_per_night);
  }
  if (input.total_price !== undefined) {
    updates.push('total_price = ?');
    args.push(input.total_price);
  }
  if (input.currency_code !== undefined) {
    updates.push('currency_code = ?');
    args.push(input.currency_code);
  }
  if (input.status !== undefined) {
    updates.push('status = ?');
    args.push(input.status);
  }
  if (input.booking_reference !== undefined) {
    updates.push('booking_reference = ?');
    args.push(input.booking_reference);
  }
  if (input.booking_source !== undefined) {
    updates.push('booking_source = ?');
    args.push(input.booking_source);
  }
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    args.push(input.notes);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    args.push(accommodationOptionId);

    await query(
      `UPDATE accommodation_options SET ${updates.join(', ')} WHERE accommodation_option_id = ?`,
      args
    );
  }

  if (input.traveler_ids) {
    await query(`DELETE FROM accommodation_option_travelers WHERE accommodation_option_id = ?`, [accommodationOptionId]);

    for (const travelerId of input.traveler_ids) {
      await query(
        `INSERT INTO accommodation_option_travelers (accommodation_option_id, traveler_id) VALUES (?, ?)`,
        [accommodationOptionId, travelerId]
      );
    }
  }

  return getAccommodationOptionById(accommodationOptionId);
}

export async function deleteAccommodationOption(accommodationOptionId: number): Promise<boolean> {
  const option = await getAccommodationOptionById(accommodationOptionId);
  if (!option) return false;

  await query(`DELETE FROM accommodation_options WHERE accommodation_option_id = ?`, [accommodationOptionId]);

  return true;
}

export async function duplicateAccommodationOption(accommodationOptionId: number): Promise<AccommodationOption | null> {
  const original = await getAccommodationOptionById(accommodationOptionId);
  if (!original) return null;

  const input: CreateAccommodationOptionInput = {
    trip_id: original.trip_id,
    type_name: original.type_name ?? undefined,
    accommodation_name: original.accommodation_name ?? undefined,
    address: original.address ?? undefined,
    location: original.location ?? undefined,
    check_in_date: original.check_in_date ?? undefined,
    check_in_time: original.check_in_time ?? undefined,
    check_out_date: original.check_out_date ?? undefined,
    check_out_time: original.check_out_time ?? undefined,
    num_rooms: original.num_rooms,
    price_per_night: original.price_per_night ?? undefined,
    total_price: original.total_price ?? undefined,
    currency_code: original.currency_code ?? undefined,
    booking_reference: undefined,
    booking_source: original.booking_source ?? undefined,
    notes: original.notes ? `${original.notes} (copy)` : '(copy)',
    traveler_ids: original.travelers?.map(t => t.traveler_id),
  };

  return createAccommodationOption(input);
}