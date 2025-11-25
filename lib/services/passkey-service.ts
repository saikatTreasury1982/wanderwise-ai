import { query } from '@/lib/db';

interface Passkey {
  credential_id: string;
  user_id: string;
  public_key: string;
  counter: number;
  device_name: string | null;
  created_at: string;
  last_used_at: string | null;
}

export async function storePasskey(
  userId: string,
  credentialId: string,
  publicKey: string,
  counter: number,
  deviceName?: string
): Promise<void> {
  try {
    await query(
      `INSERT INTO auth_passkeys (
        credential_id, user_id, public_key, counter, device_name
      ) VALUES (?, ?, ?, ?, ?)`,
      [credentialId, userId, publicKey, counter, deviceName || null]
    );
  } catch (error) {
    console.error('Error storing passkey:', error);
    throw error;
  }
}

export async function getPasskey(credentialId: string): Promise<Passkey | null> {
  try {
    const passkeys = await query<Passkey>(
      'SELECT * FROM auth_passkeys WHERE credential_id = ?',
      [credentialId]
    );
    return passkeys.length > 0 ? passkeys[0] : null;
  } catch (error) {
    console.error('Error fetching passkey:', error);
    throw error;
  }
}

export async function updatePasskeyCounter(
  credentialId: string,
  counter: number
): Promise<void> {
  try {
    await query(
      `UPDATE auth_passkeys 
       SET counter = ?, last_used_at = datetime('now')
       WHERE credential_id = ?`,
      [counter, credentialId]
    );
  } catch (error) {
    console.error('Error updating passkey counter:', error);
    throw error;
  }
}

export async function getUserPasskeys(userId: string): Promise<Passkey[]> {
  try {
    return await query<Passkey>(
      'SELECT * FROM auth_passkeys WHERE user_id = ? ORDER BY created_at DESC',
      [userId]
    );
  } catch (error) {
    console.error('Error fetching user passkeys:', error);
    throw error;
  }
}