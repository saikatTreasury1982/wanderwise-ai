export interface TripDestination {
  destination_id: number;
  trip_id: number;
  country: string;
  city: string | null;
  display_order: number;
  created_at: string;
}

export interface CreateDestinationInput {
  trip_id: number;
  country: string;
  city?: string | null;
  display_order?: number;
}