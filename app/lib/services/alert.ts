import { query } from '@/app/lib/db';
import type {
  AlertCategory,
  AlertType,
  CreateAlertTypeInput,
  UpdateAlertTypeInput,
  TripAlertSetting,
  TripAlertSettingWithDetails,
} from '@/app/lib/types/alert';

// Alert Categories (Master)

export async function getAlertCategories(): Promise<AlertCategory[]> {
  return query<AlertCategory>(`SELECT * FROM alert_categories ORDER BY category_code`);
}

// Alert Types (User-defined)

export async function getAlertTypesByUser(userId: string): Promise<AlertType[]> {
  return query<AlertType>(
    `SELECT at.*, ac.icon 
     FROM alert_types at
     JOIN alert_categories ac ON at.category_code = ac.category_code
     WHERE at.user_id = ?
     ORDER BY at.display_order, at.alert_code`,
    [userId]
  );
}

export async function getAlertTypeByCode(userId: string, alertCode: string): Promise<AlertType | null> {
  const rows = await query<AlertType>(
    `SELECT at.*, ac.icon 
     FROM alert_types at
     JOIN alert_categories ac ON at.category_code = ac.category_code
     WHERE at.user_id = ? AND at.alert_code = ?`,
    [userId, alertCode]
  );
  return rows.length > 0 ? rows[0] : null;
}

export async function createAlertType(userId: string, input: CreateAlertTypeInput): Promise<AlertType> {
  const [{ maxOrder }] = await query<{ maxOrder: number | null }>(
    `SELECT MAX(display_order) as maxOrder FROM alert_types WHERE user_id = ?`,
    [userId]
  );

  const displayOrder = input.display_order ?? (maxOrder ?? 0) + 1;

  await query(
    `INSERT INTO alert_types (alert_code, user_id, alert_description, category_code, display_order)
     VALUES (?, ?, ?, ?, ?)`,
    [input.alert_code, userId, input.alert_description, input.category_code, displayOrder]
  );

  return (await getAlertTypeByCode(userId, input.alert_code))!;
}

export async function updateAlertType(
  userId: string,
  alertCode: string,
  input: UpdateAlertTypeInput
): Promise<AlertType | null> {
  const current = await getAlertTypeByCode(userId, alertCode);
  if (!current) return null;

  const updates: string[] = [];
  const args: (string | number)[] = [];

  if (input.alert_description !== undefined) {
    updates.push('alert_description = ?');
    args.push(input.alert_description);
  }
  if (input.category_code !== undefined) {
    updates.push('category_code = ?');
    args.push(input.category_code);
  }
  if (input.display_order !== undefined) {
    updates.push('display_order = ?');
    args.push(input.display_order);
  }

  if (updates.length > 0) {
    args.push(userId, alertCode);
    await query(
      `UPDATE alert_types SET ${updates.join(', ')} WHERE user_id = ? AND alert_code = ?`,
      args
    );
  }

  return getAlertTypeByCode(userId, alertCode);
}

export async function deleteAlertType(userId: string, alertCode: string): Promise<boolean> {
  const current = await getAlertTypeByCode(userId, alertCode);
  if (!current) return false;

  await query(`DELETE FROM alert_types WHERE user_id = ? AND alert_code = ?`, [userId, alertCode]);
  return true;
}

// Trip Alert Settings

export async function getTripAlertSettings(tripId: number, userId: string): Promise<TripAlertSettingWithDetails[]> {
  return query<TripAlertSettingWithDetails>(
    `SELECT tas.*, at.alert_description, at.category_code, ac.icon
     FROM trip_alert_settings tas
     JOIN alert_types at ON tas.alert_code = at.alert_code AND tas.user_id = at.user_id
     JOIN alert_categories ac ON at.category_code = ac.category_code
     WHERE tas.trip_id = ? AND tas.user_id = ?
     ORDER BY at.display_order`,
    [tripId, userId]
  );
}

export async function setTripAlertSetting(
  tripId: number,
  userId: string,
  alertCode: string,
  alertDays: number
): Promise<TripAlertSetting> {
  await query(
    `INSERT OR REPLACE INTO trip_alert_settings (trip_id, alert_code, user_id, alert_days)
     VALUES (?, ?, ?, ?)`,
    [tripId, alertCode, userId, alertDays]
  );

  return { trip_id: tripId, alert_code: alertCode, user_id: userId, alert_days: alertDays };
}

export async function deleteTripAlertSetting(tripId: number, userId: string, alertCode: string): Promise<boolean> {
  await query(
    `DELETE FROM trip_alert_settings WHERE trip_id = ? AND user_id = ? AND alert_code = ?`,
    [tripId, userId, alertCode]
  );
  return true;
}