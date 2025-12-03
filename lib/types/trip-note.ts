export interface TripNoteType {
  type_name: string;
  display_order: number;
}

export interface TripNote {
  note_id: number;
  trip_id: number;
  type_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface CreateTripNoteInput {
  trip_id: number;
  type_name: string;
  content: string;
}

export interface UpdateTripNoteInput {
  content?: string;
  type_name?: string;
}