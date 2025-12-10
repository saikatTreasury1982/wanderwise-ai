import { createClient, Transaction } from '@libsql/client';

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

// Helper function to execute queries within a transaction
export async function queryTx<T = any>(tx: Transaction, sql: string, params: any[] = []): Promise<T[]> {
  try {
    const result = await tx.execute({
      sql,
      args: params,
    });
    return result.rows as T[];
  } catch (error) {
    console.error('Database transaction query error:', error);
    throw error;
  }
}

// Helper function to run operations in a transaction
export async function withTransaction<T>(
  operation: (tx: Transaction) => Promise<T>
): Promise<T> {
  const tx = await db.transaction('write');
  try {
    const result = await operation(tx);
    await tx.commit();
    return result;
  } catch (error) {
    await tx.rollback();
    console.error('Transaction rolled back:', error);
    throw error;
  }
}