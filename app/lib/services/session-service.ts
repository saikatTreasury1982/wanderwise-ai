import { query } from '@/app/lib/db';

interface Session {
  session_id: number;
  session_token: string;
  user_id: string;
  credential_id: string | null;
  session_status: string;
  created_at: string;
  closed_at: string | null;
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
        session_token, user_id, credential_id, session_status
      ) VALUES (?, ?, ?, 'OPEN')`,
      [sessionToken, userId, credentialId || null]
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
       AND session_status = 'OPEN'`,
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

export async function closeSession(sessionToken: string): Promise<void> {
  try {
    await query(
      `UPDATE auth_sessions 
       SET session_status = 'CLOSED', closed_at = datetime('now')
       WHERE session_token = ? AND session_status = 'OPEN'`,
      [sessionToken]
    );
  } catch (error) {
    console.error('Error closing session:', error);
    throw error;
  }
}

export async function verifySession(sessionToken: string): Promise<boolean> {
  try {
    const sessions = await query<Session>(
      `SELECT session_id FROM auth_sessions 
       WHERE session_token = ? 
       AND session_status = 'OPEN'`,
      [sessionToken]
    );
    return sessions.length > 0;
  } catch (error) {
    console.error('Error verifying session:', error);
    return false;
  }
}