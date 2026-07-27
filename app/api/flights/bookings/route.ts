import { NextResponse } from 'next/server';
import { query, withTransaction, queryTx } from '@/app/lib/db';

export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tripId = searchParams.get('trip_id');
  if (!tripId) {
    return NextResponse.json({ error: 'trip_id is required' }, { status: 400 });
  }

  try {
    const bookings = await query(
      `SELECT * FROM flight_bookings
       WHERE trip_id = ? AND status != 'cancelled'
       ORDER BY booking_id DESC`,
      [tripId]
    );

    const withLegs = await Promise.all(
      bookings.map(async (b: any) => {
        const legs = await query(
          `SELECT * FROM flight_booking_legs
           WHERE booking_id = ? ORDER BY leg_order`,
          [b.booking_id]
        );
        return { ...b, legs };
      })
    );

    return NextResponse.json({ bookings: withLegs });
  } catch (err) {
    console.error('List bookings failed:', err);
    return NextResponse.json({ error: 'Failed to load bookings' }, { status: 500 });
  }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { trip_id, booking, legs, extraction_status } = body;

        if (!trip_id) {
            return NextResponse.json({ error: 'trip_id is required' }, { status: 400 });
        }
        if (!Array.isArray(legs) || legs.length === 0) {
            return NextResponse.json({ error: 'At least one leg is required' }, { status: 400 });
        }

        const bookingId = await withTransaction(async (tx) => {
            const res = await queryTx<{ booking_id: number }>(
                tx,
                `INSERT INTO flight_bookings
           (trip_id, agency_reference, airline_pnr, booking_source, booking_date,
            total_paid, base_fare, currency_code, fare_breakdown,
            extraction_status, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
         RETURNING booking_id`,
                [
                    trip_id,
                    booking.agency_reference ?? null,
                    booking.airline_pnr ?? null,
                    booking.booking_source ?? null,
                    booking.booking_date ?? null,
                    booking.total_paid ?? null,
                    booking.base_fare ?? null,
                    booking.currency_code ?? null,
                    booking.fare_breakdown ? JSON.stringify(booking.fare_breakdown) : null,
                    extraction_status ?? 'extracted',
                ]
            );

            const idRes = await queryTx<{ id: number }>(
                tx,
                'SELECT last_insert_rowid() AS id'
            );
            const newId = res[0].booking_id;

            for (let i = 0; i < legs.length; i++) {
                const l = legs[i];
                await queryTx(
                    tx,
                    `INSERT INTO flight_booking_legs
             (booking_id, leg_order,
              departure_airport_code, departure_airport_name, departure_city,
              departure_terminal, departure_datetime,
              arrival_airport_code, arrival_airport_name, arrival_city,
              arrival_terminal, arrival_datetime,
              airline, airline_code, flight_number, cabin_class, fare_class,
              duration_minutes, stops_count, baggage_allowance, checkin_reference)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [
                        newId,
                        l.leg_order ?? i + 1,
                        l.departure_airport_code ?? null,
                        l.departure_airport_name ?? null,
                        l.departure_city ?? null,
                        l.departure_terminal ?? null,
                        l.departure_datetime ?? null,
                        l.arrival_airport_code ?? null,
                        l.arrival_airport_name ?? null,
                        l.arrival_city ?? null,
                        l.arrival_terminal ?? null,
                        l.arrival_datetime ?? null,
                        l.airline ?? null,
                        l.airline_code ?? null,
                        l.flight_number ?? null,
                        l.cabin_class ?? null,
                        l.fare_class ?? null,
                        l.duration_minutes ?? null,
                        l.stops_count ?? 0,
                        l.baggage_allowance ?? null,
                        l.checkin_reference ?? null,
                    ]
                );
            }

            return newId;
        });

        return NextResponse.json({ booking_id: bookingId });
    } catch (err) {
        console.error('Save booking failed:', err);
        return NextResponse.json({ error: 'Failed to save booking' }, { status: 500 });
    }
}