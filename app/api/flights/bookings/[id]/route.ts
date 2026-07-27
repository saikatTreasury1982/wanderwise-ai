import { NextResponse } from 'next/server';
import { query, withTransaction, queryTx } from '@/app/lib/db';

export const runtime = 'nodejs';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const { booking, legs } = await request.json();

    if (!Array.isArray(legs) || legs.length === 0) {
      return NextResponse.json({ error: 'At least one leg is required' }, { status: 400 });
    }

    await withTransaction(async (tx) => {
      await queryTx(
        tx,
        `UPDATE flight_bookings SET
           agency_reference = ?, airline_pnr = ?, booking_source = ?, booking_date = ?,
           total_paid = ?, base_fare = ?, currency_code = ?, fare_breakdown = ?
         WHERE booking_id = ?`,
        [
          booking.agency_reference ?? null,
          booking.airline_pnr ?? null,
          booking.booking_source ?? null,
          booking.booking_date ?? null,
          booking.total_paid ?? null,
          booking.base_fare ?? null,
          booking.currency_code ?? null,
          booking.fare_breakdown ? JSON.stringify(booking.fare_breakdown) : null,
          id,
        ]
      );

      // Replace legs wholesale
      await queryTx(tx, 'DELETE FROM flight_booking_legs WHERE booking_id = ?', [id]);

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
            id, l.leg_order ?? i + 1,
            l.departure_airport_code ?? null, l.departure_airport_name ?? null, l.departure_city ?? null,
            l.departure_terminal ?? null, l.departure_datetime ?? null,
            l.arrival_airport_code ?? null, l.arrival_airport_name ?? null, l.arrival_city ?? null,
            l.arrival_terminal ?? null, l.arrival_datetime ?? null,
            l.airline ?? null, l.airline_code ?? null, l.flight_number ?? null,
            l.cabin_class ?? null, l.fare_class ?? null,
            l.duration_minutes ?? null, l.stops_count ?? 0,
            l.baggage_allowance ?? null, l.checkin_reference ?? null,
          ]
        );
      }
    });

    return NextResponse.json({ booking_id: Number(id) });
  } catch (err) {
    console.error('Update booking failed:', err);
    return NextResponse.json({ error: 'Failed to update booking' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    // legs cascade via FK
    await query('DELETE FROM flight_bookings WHERE booking_id = ?', [id]);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Delete booking failed:', err);
    return NextResponse.json({ error: 'Failed to delete booking' }, { status: 500 });
  }
}