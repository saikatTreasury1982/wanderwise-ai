export interface AccommodationType {
  type_name: string;
}

export interface AccommodationOption {
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
  status: 'draft' | 'shortlisted' | 'confirmed' | 'not_selected';
  booking_reference: string | null;
  booking_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  travelers?: AccommodationOptionTraveler[];
}

export interface AccommodationOptionTraveler {
  id: number;
  accommodation_option_id: number;
  traveler_id: number;
  traveler_name: string;
}

export interface CreateAccommodationOptionInput {
  trip_id: number;
  type_name?: string;
  accommodation_name?: string;
  address?: string;
  location?: string;
  check_in_date?: string;
  check_in_time?: string;
  check_out_date?: string;
  check_out_time?: string;
  num_rooms?: number;
  price_per_night?: number;
  total_price?: number;
  currency_code?: string;
  booking_reference?: string;
  booking_source?: string;
  notes?: string;
  traveler_ids?: number[];
}

export interface UpdateAccommodationOptionInput {
  type_name?: string;
  accommodation_name?: string;
  address?: string;
  location?: string;
  check_in_date?: string;
  check_in_time?: string;
  check_out_date?: string;
  check_out_time?: string;
  num_rooms?: number;
  price_per_night?: number;
  total_price?: number;
  currency_code?: string;
  status?: 'draft' | 'shortlisted' | 'confirmed' | 'not_selected';
  booking_reference?: string;
  booking_source?: string;
  notes?: string;
  traveler_ids?: number[];
}