export interface FlightOption {
  flight_option_id: number;
  trip_id: number;
  flight_type: 'one_way' | 'round_trip' | 'multi_city';
  linked_flight_id: number | null;
  unit_fare: number | null;
  currency_code: string | null;
  status: 'draft' | 'shortlisted' | 'confirmed' | 'not_selected';
  notes: string | null;
  created_at: string;
  updated_at: string;
  legs?: FlightLeg[];
  travelers?: FlightOptionTraveler[];
  // For grouped round-trip display
  return_legs?: FlightLeg[];
  return_flight_id?: number;
}

export interface FlightLeg {
  leg_id: number;
  flight_option_id: number;
  leg_order: number;
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  departure_time: string | null;
  arrival_date: string;
  arrival_time: string | null;
  airline: string | null;
  flight_number: string | null;
  stops_count: number;
  duration_minutes: number | null;
}

export interface FlightOptionTraveler {
  id: number;
  flight_option_id: number;
  traveler_id: number;
  traveler_name: string;
  is_cost_sharer: number;
}

export interface CreateFlightOptionInput {
  trip_id: number;
  flight_type: 'one_way' | 'round_trip' | 'multi_city';
  unit_fare?: number;
  currency_code?: string;
  notes?: string;
  legs: CreateFlightLegInput[];
  traveler_ids?: number[];
  // For round_trip: return leg data
  return_legs?: CreateFlightLegInput[];
  return_price?: number;
}

export interface CreateFlightLegInput {
  leg_order: number;
  departure_airport: string;
  arrival_airport: string;
  departure_date: string;
  departure_time?: string;
  arrival_date: string;
  arrival_time?: string;
  airline?: string;
  flight_number?: string;
  stops_count?: number;
  duration_minutes?: number;
}

export interface UpdateFlightOptionInput {
  unit_fare?: number;
  currency_code?: string;
  status?: 'draft' | 'shortlisted' | 'confirmed' | 'not_selected';
  notes?: string;
  legs?: CreateFlightLegInput[];
  return_legs?: CreateFlightLegInput[];
  traveler_ids?: number[];
}