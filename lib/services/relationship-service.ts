import { query } from '@/app/lib/db';

interface Relationship {
  relationship_code: string;
  relationship_name: string;
}

export async function getAllRelationships(): Promise<Relationship[]> {
  try {
    return await query<Relationship>(
      'SELECT relationship_code, relationship_name FROM traveler_relationships ORDER BY relationship_code'
    );
  } catch (error) {
    console.error('Error fetching relationships:', error);
    throw error;
  }
}