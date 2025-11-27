import { query } from '@/lib/db';

interface Currency {
  currency_code: string;
  currency_name: string;
}

export async function getAllCurrencies(): Promise<Currency[]> {
  try {
    return await query<Currency>(
      'SELECT currency_code, currency_name FROM currencies ORDER BY currency_code'
    );
  } catch (error) {
    console.error('Error fetching currencies:', error);
    throw error;
  }
}