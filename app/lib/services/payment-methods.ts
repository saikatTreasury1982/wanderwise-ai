import { query } from '@/app/lib/db';

export interface PaymentMethod {
  payment_method_id: number;
  user_id: string;
  payment_type: string;
  issuer: string;
  payment_network: string;
  payment_channel: string;
  payment_method_key: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface CreatePaymentMethodInput {
  user_id: string;
  payment_type: string;
  issuer: string;
  payment_network: string;
  payment_channel: string;
  payment_method_key: string;
  is_active?: number;
}

export interface UpdatePaymentMethodInput {
  payment_type?: string;
  issuer?: string;
  payment_network?: string;
  payment_channel?: string;
  payment_method_key?: string;
  is_active?: number;
}

export async function getPaymentMethodsByUser(userId: string): Promise<PaymentMethod[]> {
  return query<PaymentMethod>(
    `SELECT * FROM payment_methods WHERE user_id = ? ORDER BY is_active DESC, created_at DESC`,
    [userId]
  );
}

export async function getPaymentMethodById(paymentMethodId: number): Promise<PaymentMethod | null> {
  const results = await query<PaymentMethod>(
    `SELECT * FROM payment_methods WHERE payment_method_id = ?`,
    [paymentMethodId]
  );
  return results.length > 0 ? results[0] : null;
}

export async function createPaymentMethod(input: CreatePaymentMethodInput): Promise<PaymentMethod> {
  await query(
    `INSERT INTO payment_methods (
      user_id, payment_type, issuer, payment_network,
      payment_channel, payment_method_key, is_active
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      input.user_id,
      input.payment_type,
      input.issuer,
      input.payment_network,
      input.payment_channel,
      input.payment_method_key,
      input.is_active ?? 1,
    ]
  );

  const [{ id }] = await query<{ id: number }>(`SELECT last_insert_rowid() as id`, []);
  return (await getPaymentMethodById(id))!;
}

export async function updatePaymentMethod(
  paymentMethodId: number,
  input: UpdatePaymentMethodInput
): Promise<PaymentMethod | null> {
  const updates: string[] = [];
  const args: (string | number)[] = [];

  if (input.payment_type !== undefined) {
    updates.push('payment_type = ?');
    args.push(input.payment_type);
  }
  if (input.issuer !== undefined) {
    updates.push('issuer = ?');
    args.push(input.issuer);
  }
  if (input.payment_network !== undefined) {
    updates.push('payment_network = ?');
    args.push(input.payment_network);
  }
  if (input.payment_channel !== undefined) {
    updates.push('payment_channel = ?');
    args.push(input.payment_channel);
  }
  if (input.payment_method_key !== undefined) {
    updates.push('payment_method_key = ?');
    args.push(input.payment_method_key);
  }
  if (input.is_active !== undefined) {
    updates.push('is_active = ?');
    args.push(input.is_active);
  }

  if (updates.length > 0) {
    updates.push('updated_at = CURRENT_TIMESTAMP');
    args.push(paymentMethodId);

    await query(
      `UPDATE payment_methods SET ${updates.join(', ')} WHERE payment_method_id = ?`,
      args
    );
  }

  return getPaymentMethodById(paymentMethodId);
}

export async function deletePaymentMethod(paymentMethodId: number): Promise<boolean> {
  const result = await query(
    `DELETE FROM payment_methods WHERE payment_method_id = ?`,
    [paymentMethodId]
  );
  return true;
}