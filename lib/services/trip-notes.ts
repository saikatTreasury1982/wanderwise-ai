import { query } from '@/lib/db';
import type {
  TripNoteType,
  TripNote,
  CreateTripNoteInput,
  UpdateTripNoteInput,
} from '@/lib/types/trip-note';

export async function getTripNoteTypes(): Promise<TripNoteType[]> {
  return query<TripNoteType>(
    `SELECT * FROM trip_note_types ORDER BY display_order`,
    []
  );
}

export async function getTripNotesByTrip(tripId: number): Promise<TripNote[]> {
  return query<TripNote>(
    `SELECT tn.* FROM trip_notes tn
     JOIN trip_note_types tnt ON tn.type_name = tnt.type_name
     WHERE tn.trip_id = ?
     ORDER BY tnt.display_order, tn.created_at`,
    [tripId]
  );
}

export async function getTripNoteById(noteId: number): Promise<TripNote | null> {
  const rows = await query<TripNote>(
    `SELECT * FROM trip_notes WHERE note_id = ?`,
    [noteId]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createTripNote(input: CreateTripNoteInput): Promise<TripNote> {
  await query(
    `INSERT INTO trip_notes (trip_id, type_name, content) VALUES (?, ?, ?)`,
    [input.trip_id, input.type_name, input.content]
  );

  const [{ id: noteId }] = await query<{ id: number }>(
    `SELECT last_insert_rowid() as id`,
    []
  );

  return (await getTripNoteById(noteId))!;
}

export async function updateTripNote(
  noteId: number,
  input: UpdateTripNoteInput
): Promise<TripNote | null> {
  const current = await getTripNoteById(noteId);
  if (!current) return null;

  const updates: string[] = [];
  const args: (string | number)[] = [];

  if (input.content !== undefined) {
    updates.push('content = ?');
    args.push(input.content);
  }
  if (input.type_name !== undefined) {
    updates.push('type_name = ?');
    args.push(input.type_name);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    args.push(noteId);

    await query(
      `UPDATE trip_notes SET ${updates.join(', ')} WHERE note_id = ?`,
      args
    );
  }

  return getTripNoteById(noteId);
}

export async function deleteTripNote(noteId: number): Promise<boolean> {
  const note = await getTripNoteById(noteId);
  if (!note) return false;

  await query(`DELETE FROM trip_notes WHERE note_id = ?`, [noteId]);
  return true;
}