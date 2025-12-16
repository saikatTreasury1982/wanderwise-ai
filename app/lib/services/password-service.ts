import { db } from '@/app/lib/db';
import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export interface PasswordPattern {
  id: string;
  min_length: number;
  require_uppercase: boolean;
  require_numbers: boolean;
  regex_pattern: string;
  description: string;
}

export async function getPasswordPattern(): Promise<PasswordPattern | null> {
  const result = await db.execute('SELECT * FROM password_patterns WHERE id = ?', ['active']);
  return result.rows[0] as unknown as PasswordPattern | null;
}

export async function validatePassword(password: string): Promise<{ valid: boolean; error?: string }> {
  const pattern = await getPasswordPattern();
  if (!pattern) return { valid: false, error: 'Password requirements not configured' };

  const regex = new RegExp(pattern.regex_pattern);
  if (!regex.test(password)) {
    return { valid: false, error: pattern.description };
  }

  return { valid: true };
}

export async function createPassword(userId: string, password: string): Promise<void> {
  const validation = await validatePassword(password);
  if (!validation.valid) throw new Error(validation.error);

  const hash = await bcrypt.hash(password, 12);
  const id = randomBytes(16).toString('hex');

  await db.execute(
    'INSERT INTO passwords (id, user_id, password_hash) VALUES (?, ?, ?)',
    [id, userId, hash]
  );
}

export async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const result = await db.execute(
    'SELECT password_hash FROM passwords WHERE user_id = ?',
    [userId]
  );

  if (result.rows.length === 0) return false;

  const { password_hash } = result.rows[0] as unknown as { password_hash: string };
  return await bcrypt.compare(password, password_hash);
}

export async function userHasPassword(userId: string): Promise<boolean> {
  const result = await db.execute(
    'SELECT id FROM passwords WHERE user_id = ?',
    [userId]
  );
  return result.rows.length > 0;
}