import { cookies } from 'next/headers';
import { getSession } from '@/app/lib/services/session-service';

const SESSION_COOKIE_NAME = 'session';

export async function getSessionToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    return sessionToken || null;
  } catch (error) {
    console.error('Error getting session token:', error);
    return null;
  }
}

export async function getCurrentUserId(): Promise<string | null> {
  try {
    const sessionToken = await getSessionToken();
    
    if (!sessionToken) {
      return null;
    }

    const session = await getSession(sessionToken);
    return session?.user_id || null;
  } catch (error) {
    console.error('Error getting current user ID:', error);
    return null;
  }
}

export async function clearSessionCookie(): Promise<void> {
  try {
    const cookieStore = await cookies();
    cookieStore.delete(SESSION_COOKIE_NAME);
  } catch (error) {
    console.error('Error clearing session cookie:', error);
    throw error;
  }
}