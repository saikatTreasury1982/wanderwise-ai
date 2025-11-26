import { query } from '@/lib/db';

interface UserPreferences {
  user_id: string;
  decimal_places: number;
  date_format: string;
  time_format: string;
  theme: string;
  notifications_enabled: number;
  first_day_of_week: string;
  measurement_system: string;
  updated_at: string;
}

export async function getUserPreferences(userId: string): Promise<UserPreferences | null> {
  try {
    const preferences = await query<UserPreferences>(
      'SELECT * FROM user_preferences WHERE user_id = ?',
      [userId]
    );
    return preferences.length > 0 ? preferences[0] : null;
  } catch (error) {
    console.error('Error fetching user preferences:', error);
    throw error;
  }
}

export async function getDefaultPreferences(): Promise<Omit<UserPreferences, 'user_id' | 'updated_at'>> {
  return {
    decimal_places: 2,
    date_format: 'YYYY-MM-DD',
    time_format: '24h',
    theme: 'light',
    notifications_enabled: 1,
    first_day_of_week: 'monday',
    measurement_system: 'metric',
  };
}