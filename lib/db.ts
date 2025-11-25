import { createClient } from '@libsql/client';

// Initialize Turso client
export const db = createClient({
  url: process.env.TURSO_DATABASE_URL || '',
  authToken: process.env.TURSO_AUTH_TOKEN || '',
});

// Helper function to execute queries
export async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  try {
    const result = await db.execute({
      sql,
      args: params,
    });
    return result.rows as T[];
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}