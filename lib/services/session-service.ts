import { query } from '@/lib/db';

interface Session {
  session_token: string;
  user_id: string;
  credential_id: string | null;
  expires_at: string;
  created_at: string;
}

export async function createSession(
  userId: string,
  credentialId?: string
): Promise<string> {
  try {
    // Generate session token
    const sessionToken = generateSessionToken();
    
    // Session expires in 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    await query(
      `INSERT INTO auth_sessions (
        session_token, user_id, credential_id, expires_at
      ) VALUES (?, ?, ?, ?)`,
      [sessionToken, userId, credentialId || null, expiresAt.toISOString()]
    );

    return sessionToken;
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function getSession(sessionToken: string): Promise<Session | null> {
  try {
    const sessions = await query<Session>(
      `SELECT * FROM auth_sessions 
       WHERE session_token = ? 
       AND datetime(expires_at) > datetime('now')`,
      [sessionToken]
    );
    return sessions.length > 0 ? sessions[0] : null;
  } catch (error) {
    console.error('Error fetching session:', error);
    throw error;
  }
}

export async function deleteSession(sessionToken: string): Promise<void> {
  try {
    await query(
      'DELETE FROM auth_sessions WHERE session_token = ?',
      [sessionToken]
    );
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

function generateSessionToken(): string {
  // Generate a secure random token
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}