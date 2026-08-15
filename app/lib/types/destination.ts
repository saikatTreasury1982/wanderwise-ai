export interface CreateDestinationInput {
  trip_id: number;
  country: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  display_order?: number;
}

export interface TripDestination {
  destination_id: number;
  trip_id: number;
  country: string;
  city: string | null;
  latitude: number | null;
  longitude: number | null;
  display_order: number;
  created_at: string;
  country_code?: string | null; // legacy column, still present
}