export interface CostLineItem {
  id: number;
  module: 'flights' | 'accommodations' | 'itinerary';
  description: string;
  amount: number;
  currency_code: string;
  cost_type: 'total' | 'per_head';
  headcount?: number;
  status?: string;
  converted_amount?: number;
  exchange_rate?: number;
}

export interface ModuleBreakdown {
  module: 'flights' | 'accommodations' | 'itinerary';
  total: number;
  currency_code: string;
  items_count: number;
  items: CostLineItem[];
}

export interface TravelerShare {
  traveler_id: number;
  traveler_name: string;
  is_primary: number;
  traveler_currency: string;
  share_amount: number;
  share_currency: string;
  display_currency?: string;
  display_amount?: number;
  exchange_rate?: number;
}

export interface FxItem {
  module: string;
  description: string;
  original_amount: number;
  original_currency: string;
  exchange_rate: number;
  converted_amount: number;
  converted_currency: string;
}

export interface CostForecastReport {
  trip_id: number;
  base_currency: string;
  total_cost: number;
  module_breakdown: ModuleBreakdown[];
  traveler_shares: TravelerShare[];
  fx_items: FxItem[];
  status_filter: string[];
  cost_sharers_count: number;
  generated_at: string;
}

export interface ExchangeRates {
  base: string;
  rates: Record<string, number>;
  fetched_at: string;
}