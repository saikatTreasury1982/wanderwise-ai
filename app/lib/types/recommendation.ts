// Recommendation types for the intelligent behavior feature

export interface RecommendationSource {
  trip_id: number;
  trip_name: string;
  start_date: string;
  end_date: string;
  status_code: number; // 3 = completed, 4 = suspended
}

export interface FlightRecommendation {
  flight_option_id: number;
  flight_type: 'one_way' | 'outbound' | 'return' | 'multi_city';
  total_price: number;
  currency_code: string;
  airline_codes: string;
  status: 'draft' | 'shortlisted' | 'confirmed' | 'not_selected';
  created_at: string;
  legs: FlightLegRecommendation[];
  source: RecommendationSource;
}

export interface FlightLegRecommendation {
  departure_airport: string;
  arrival_airport: string;
  departure_datetime: string;
  arrival_datetime: string;
  airline_code: string;
  flight_number: string | null;
  stops_count: number;
  duration_minutes: number;
}

export interface AccommodationRecommendation {
  accommodation_option_id: number;
  accommodation_type: string;
  property_name: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  currency_code: string;
  status: 'draft' | 'shortlisted' | 'confirmed' | 'not_selected';
  nights: number;
  source: RecommendationSource;
}

export interface PackingRecommendation {
  category_name: string;
  items: PackingItemRecommendation[];
  source: RecommendationSource;
}

export interface PackingItemRecommendation {
  item_name: string;
  quantity: number;
}

export interface ItineraryRecommendation {
  day_number: number;
  day_description: string | null;
  categories: ItineraryCategoryRecommendation[];
  source: RecommendationSource;
}

export interface ItineraryCategoryRecommendation {
  category_name: string;
  category_cost: number | null;
  currency_code: string | null;
  activities: ItineraryActivityRecommendation[];
}

export interface ItineraryActivityRecommendation {
  activity_name: string;
  start_time: string | null;
  end_time: string | null;
  activity_cost: number | null;
  currency_code: string | null;
}

export interface RecommendationAvailability {
  hasRecommendations: boolean;
  sources: RecommendationSource[];
  counts: {
    flights: number;
    accommodations: number;
    packingCategories: number;
    itineraryDays: number;
  };
}

export interface RecommendationResponse<T> {
  recommendations: T[];
  source: RecommendationSource | null;
  count: number;
}