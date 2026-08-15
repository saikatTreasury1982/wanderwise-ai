export interface TripListItem {
  trip_id: number;
  trip_name: string;
  trip_description: string | null;
  start_date: string;
  end_date: string;
  status_code: number;
  first_city: string | null;
  first_country: string | null;
  first_latitude: number | null;
  first_longitude: number | null;
  all_destinations: string | null;
  active_travelers: number;
  cost_sharers: number;
}

export interface TripStatus {
  status_code: number;
  status_name: string;
}