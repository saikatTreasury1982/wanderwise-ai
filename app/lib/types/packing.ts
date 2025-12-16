export interface PackingCategory {
  category_id: number;
  trip_id: number;
  category_name: string;
  display_order: number;
  created_at: string;
  items?: PackingItem[];
}

export interface PackingItem {
  item_id: number;
  category_id: number;
  item_name: string;
  is_packed: number;
  priority: string;
  display_order: number;
  created_at: string;
}

export interface CreatePackingCategoryInput {
  trip_id: number;
  category_name: string;
  display_order?: number;
}

export interface UpdatePackingCategoryInput {
  category_name?: string;
  display_order?: number;
}

export interface CreatePackingItemInput {
  category_id: number;
  item_name: string;
  display_order?: number;
}

export interface UpdatePackingItemInput {
  item_name?: string;
  is_packed?: number;
  priority?: string;
  display_order?: number;
}

export interface PackingStats {
  totalItems: number;
  packedItems: number;
  percentage: number;
}

export interface PackingAlert {
  trip_id: number;
  trip_name: string;
  days_until: number;
  critical_items: PackingItem[];
  important_items: PackingItem[];
}