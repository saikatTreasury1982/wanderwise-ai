export interface AlertCategory {
  category_code: string;
  icon: string;
}

export interface AlertType {
  alert_code: string;
  user_id: string;
  alert_description: string;
  category_code: string;
  display_order: number;
  icon?: string; // Joined from alert_categories
}

export interface CreateAlertTypeInput {
  alert_code: string;
  alert_description: string;
  category_code: string;
  display_order?: number;
}

export interface UpdateAlertTypeInput {
  alert_description?: string;
  category_code?: string;
  display_order?: number;
}

export interface TripAlertSetting {
  trip_id: number;
  alert_code: string;
  user_id: string;
  alert_days: number;
}

export interface TripAlertSettingWithDetails extends TripAlertSetting {
  alert_description: string;
  category_code: string;
  icon: string;
}