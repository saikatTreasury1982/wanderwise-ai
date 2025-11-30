import { query } from '@/lib/db';
import type {
  FlightOption,
  FlightLeg,
  CreateFlightOptionInput,
  UpdateFlightOptionInput,
} from '@/lib/types/flight';

export async function getFlightOptionsByTrip(tripId: number): Promise<FlightOption[]> {
  const options = await query<FlightOption>(
    `SELECT * FROM flight_options WHERE trip_id = ? ORDER BY created_at DESC`,
    [tripId]
  );

  const flightOptions: FlightOption[] = [];

  for (const row of options) {
    const legs = await query<FlightLeg>(
      `SELECT * FROM flight_legs WHERE flight_option_id = ? ORDER BY leg_order`,
      [row.flight_option_id]
    );

    const travelers = await query<{ id: number; flight_option_id: number; traveler_id: number }>(
      `SELECT * FROM flight_option_travelers WHERE flight_option_id = ?`,
      [row.flight_option_id]
    );

    flightOptions.push({
      ...row,
      legs,
      travelers,
    });
  }

  return flightOptions;
}

export async function getFlightOptionById(flightOptionId: number): Promise<FlightOption | null> {
  const rows = await query<FlightOption>(
    `SELECT * FROM flight_options WHERE flight_option_id = ?`,
    [flightOptionId]
  );

  if (rows.length === 0) return null;

  const legs = await query<FlightLeg>(
    `SELECT * FROM flight_legs WHERE flight_option_id = ? ORDER BY leg_order`,
    [flightOptionId]
  );

  const travelers = await query<{ id: number; flight_option_id: number; traveler_id: number }>(
    `SELECT * FROM flight_option_travelers WHERE flight_option_id = ?`,
    [flightOptionId]
  );

  return {
    ...rows[0],
    legs,
    travelers,
  };
}

export async function getFlightOptionsGrouped(tripId: number): Promise<FlightOption[]> {
  const allOptions = await getFlightOptionsByTrip(tripId);
  
  const grouped: FlightOption[] = [];
  const processedIds = new Set<number>();

  for (const option of allOptions) {
    if (processedIds.has(option.flight_option_id)) continue;

    if (option.flight_type === 'round_trip' && option.linked_flight_id) {
      const linkedFlight = allOptions.find(f => f.flight_option_id === option.linked_flight_id);
      
      if (linkedFlight) {
        // Always use the lower ID as outbound (the one created first)
        const outbound = option.flight_option_id < linkedFlight.flight_option_id ? option : linkedFlight;
        const returnFlight = option.flight_option_id < linkedFlight.flight_option_id ? linkedFlight : option;
        
        // Add return legs to outbound for display
        (outbound as any).return_legs = returnFlight.legs;
        (outbound as any).return_flight_id = returnFlight.flight_option_id;
        grouped.push(outbound);
        
        // Mark both as processed
        processedIds.add(option.flight_option_id);
        processedIds.add(linkedFlight.flight_option_id);
      } else {
        grouped.push(option);
        processedIds.add(option.flight_option_id);
      }
    } else {
      grouped.push(option);
      processedIds.add(option.flight_option_id);
    }
  }

  return grouped;
}

export async function createFlightOption(input: CreateFlightOptionInput): Promise<FlightOption> {
  // Create main flight option
  await query(
    `INSERT INTO flight_options (trip_id, flight_type, total_price, currency_code, notes)
     VALUES (?, ?, ?, ?, ?)`,
    [input.trip_id, input.flight_type, input.total_price ?? null, input.currency_code ?? null, input.notes ?? null]
  );

  const [{ id: flightOptionId }] = await query<{ id: number }>(`SELECT last_insert_rowid() as id`, []);

  // Create legs
  for (const leg of input.legs) {
    await query(
      `INSERT INTO flight_legs (flight_option_id, leg_order, departure_airport, arrival_airport, 
       departure_date, departure_time, arrival_date, arrival_time, airline, flight_number, stops_count, duration_minutes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        flightOptionId, leg.leg_order, leg.departure_airport, leg.arrival_airport,
        leg.departure_date, leg.departure_time ?? null, leg.arrival_date, leg.arrival_time ?? null,
        leg.airline ?? null, leg.flight_number ?? null, leg.stops_count ?? 0, leg.duration_minutes ?? null,
      ]
    );
  }

  // Create traveler associations
  if (input.traveler_ids?.length) {
    for (const travelerId of input.traveler_ids) {
      await query(
        `INSERT INTO flight_option_travelers (flight_option_id, traveler_id) VALUES (?, ?)`,
        [flightOptionId, travelerId]
      );
    }
  }

  // Handle round_trip: create return flight and link
  if (input.flight_type === 'round_trip' && input.return_legs?.length) {
    await query(
      `INSERT INTO flight_options (trip_id, flight_type, linked_flight_id, total_price, currency_code, notes)
       VALUES (?, 'round_trip', ?, ?, ?, ?)`,
      [input.trip_id, flightOptionId, input.return_price ?? null, input.currency_code ?? null, input.notes ?? null]
    );

    const [{ id: returnFlightId }] = await query<{ id: number }>(`SELECT last_insert_rowid() as id`, []);

    // Link outbound to return
    await query(
      `UPDATE flight_options SET linked_flight_id = ? WHERE flight_option_id = ?`,
      [returnFlightId, flightOptionId]
    );

    // Create return legs
    for (const leg of input.return_legs) {
      await query(
        `INSERT INTO flight_legs (flight_option_id, leg_order, departure_airport, arrival_airport,
         departure_date, departure_time, arrival_date, arrival_time, airline, flight_number, stops_count, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          returnFlightId, leg.leg_order, leg.departure_airport, leg.arrival_airport,
          leg.departure_date, leg.departure_time ?? null, leg.arrival_date, leg.arrival_time ?? null,
          leg.airline ?? null, leg.flight_number ?? null, leg.stops_count ?? 0, leg.duration_minutes ?? null,
        ]
      );
    }

    // Copy traveler associations to return flight
    if (input.traveler_ids?.length) {
      for (const travelerId of input.traveler_ids) {
        await query(
          `INSERT INTO flight_option_travelers (flight_option_id, traveler_id) VALUES (?, ?)`,
          [returnFlightId, travelerId]
        );
      }
    }
  }

  return (await getFlightOptionById(flightOptionId))!;
}

export async function updateFlightOption(flightOptionId: number, input: UpdateFlightOptionInput): Promise<FlightOption | null> {
  // Get current option to check for linked flight
  const current = await getFlightOptionById(flightOptionId);
  const updates: string[] = [];
  if (!current) return null;
  const args: (string | number | null)[] = [];

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
  if (input.notes !== undefined) {
    updates.push('notes = ?');
    args.push(input.notes);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    args.push(flightOptionId);

    await query(
      `UPDATE flight_options SET ${updates.join(', ')} WHERE flight_option_id = ?`,
      args
    );
  }

  // Update legs if provided
  if (input.legs) {
    await query(`DELETE FROM flight_legs WHERE flight_option_id = ?`, [flightOptionId]);

    for (const leg of input.legs) {
      await query(
        `INSERT INTO flight_legs (flight_option_id, leg_order, departure_airport, arrival_airport,
         departure_date, departure_time, arrival_date, arrival_time, airline, flight_number, stops_count, duration_minutes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          flightOptionId, leg.leg_order, leg.departure_airport, leg.arrival_airport,
          leg.departure_date, leg.departure_time ?? null, leg.arrival_date, leg.arrival_time ?? null,
          leg.airline ?? null, leg.flight_number ?? null, leg.stops_count ?? 0, leg.duration_minutes ?? null,
        ]
      );
    }
  }

  // Update return legs if provided and linked flight exists
  if (input.return_legs && input.return_legs.length > 0 && current.linked_flight_id) {
    await query(`DELETE FROM flight_legs WHERE flight_option_id = ?`, [current.linked_flight_id]);

    for (const leg of input.return_legs) {
      await query(
        `INSERT INTO flight_legs (flight_option_id, leg_order, departure_airport, arrival_airport,
        departure_date, departure_time, arrival_date, arrival_time, airline, flight_number, stops_count, duration_minutes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          current.linked_flight_id, leg.leg_order, leg.departure_airport, leg.arrival_airport,
          leg.departure_date, leg.departure_time ?? null, leg.arrival_date, leg.arrival_time ?? null,
          leg.airline ?? null, leg.flight_number ?? null, leg.stops_count ?? 0, leg.duration_minutes ?? null,
        ]
      );
    }
  }

  // Update travelers for linked flight too
  if (input.traveler_ids && current.linked_flight_id) {
    await query(`DELETE FROM flight_option_travelers WHERE flight_option_id = ?`, [current.linked_flight_id]);

    for (const travelerId of input.traveler_ids) {
      await query(
        `INSERT INTO flight_option_travelers (flight_option_id, traveler_id) VALUES (?, ?)`,
        [current.linked_flight_id, travelerId]
      );
    }
  }

  // Update travelers if provided
  if (input.traveler_ids) {
    await query(`DELETE FROM flight_option_travelers WHERE flight_option_id = ?`, [flightOptionId]);

    for (const travelerId of input.traveler_ids) {
      await query(
        `INSERT INTO flight_option_travelers (flight_option_id, traveler_id) VALUES (?, ?)`,
        [flightOptionId, travelerId]
      );
    }
  }

  // If status changed and this is a round-trip, update linked flight too
  if (input.status && current.linked_flight_id) {
    await query(
      `UPDATE flight_options SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE flight_option_id = ?`,
      [input.status, current.linked_flight_id]
    );
  }

  return getFlightOptionById(flightOptionId);
}

export async function deleteFlightOption(flightOptionId: number): Promise<boolean> {
  const option = await getFlightOptionById(flightOptionId);
  if (!option) return false;

  // Delete linked flight if exists
  if (option.linked_flight_id) {
    await query(`DELETE FROM flight_options WHERE flight_option_id = ?`, [option.linked_flight_id]);
  }

  // Delete main flight (cascades to legs and travelers)
  await query(`DELETE FROM flight_options WHERE flight_option_id = ?`, [flightOptionId]);

  return true;
}

export async function duplicateFlightOption(flightOptionId: number): Promise<FlightOption | null> {
  // Get grouped version to include return_legs
  const allGrouped = await getFlightOptionsGrouped(
    (await getFlightOptionById(flightOptionId))?.trip_id ?? 0
  );
  const original = allGrouped.find(f => f.flight_option_id === flightOptionId);
  
  if (!original) return null;

  const input: CreateFlightOptionInput = {
    trip_id: original.trip_id,
    flight_type: original.flight_type,
    total_price: original.total_price ?? undefined,
    currency_code: original.currency_code ?? undefined,
    notes: original.notes ? `${original.notes} (copy)` : '(copy)',
    legs: original.legs?.map(leg => ({
      leg_order: leg.leg_order,
      departure_airport: leg.departure_airport,
      arrival_airport: leg.arrival_airport,
      departure_date: leg.departure_date,
      departure_time: leg.departure_time ?? undefined,
      arrival_date: leg.arrival_date,
      arrival_time: leg.arrival_time ?? undefined,
      airline: leg.airline ?? undefined,
      flight_number: leg.flight_number ?? undefined,
      stops_count: leg.stops_count,
      duration_minutes: leg.duration_minutes ?? undefined,
    })) ?? [],
    traveler_ids: original.travelers?.map(t => t.traveler_id),
    // Include return legs for round-trip
    return_legs: original.return_legs?.map(leg => ({
      leg_order: leg.leg_order,
      departure_airport: leg.departure_airport,
      arrival_airport: leg.arrival_airport,
      departure_date: leg.departure_date,
      departure_time: leg.departure_time ?? undefined,
      arrival_date: leg.arrival_date,
      arrival_time: leg.arrival_time ?? undefined,
      airline: leg.airline ?? undefined,
      flight_number: leg.flight_number ?? undefined,
      stops_count: leg.stops_count,
      duration_minutes: leg.duration_minutes ?? undefined,
    })),
  };

  return createFlightOption(input);
}