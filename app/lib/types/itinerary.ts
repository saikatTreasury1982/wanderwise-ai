export interface ItineraryDay {
  day_id: number;
  trip_id: number;
  day_number: number;
  day_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
  categories?: ItineraryDayCategory[];
}

export interface ItineraryDayCategory {
  category_id: number;
  day_id: number;
  category_name: string;
  category_cost: number | null;
  currency_code: string | null;
  display_order: number;
  is_expanded: number;
  created_at: string;
  activities?: ItineraryActivity[];
}

export interface ItineraryActivity {
  activity_id: number;
  category_id: number;
  activity_name: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number | null;
  activity_cost: number | null;
  currency_code: string | null;
  notes: string | null;
  display_order: number;
  is_completed: number;
  created_at: string;
}

export interface CreateItineraryDayInput {
  trip_id: number;
  day_number: number;
  day_date: string;
  description?: string;
}

export interface UpdateItineraryDayInput {
  day_date?: string;
  description?: string;
}

export interface CreateItineraryCategoryInput {
  day_id: number;
  category_name: string;
  category_cost?: number;
  currency_code?: string;
  display_order?: number;
}

export interface UpdateItineraryCategoryInput {
  category_name?: string;
  category_cost?: number | null;
  currency_code?: string | null;
  display_order?: number;
  is_expanded?: number;
}

export interface CreateItineraryActivityInput {
  category_id: number;
  activity_name: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  activity_cost?: number;
  currency_code?: string;
  notes?: string;
  display_order?: number;
}

export interface UpdateItineraryActivityInput {
  activity_name?: string;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number | null;
  activity_cost?: number | null;
  currency_code?: string | null;
  notes?: string | null;
  display_order?: number;
  is_completed?: number;
}

// Cost summary by currency
export interface CostSummary {
  currency_code: string;
  total: number;
}