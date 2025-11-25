import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  decimalPlaces: number = 2
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currencyCode,
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(amount);
}

export function formatDate(
  date: Date | string,
  format: 'YYYY-MM-DD' | 'DD-MM-YYYY' | 'MM-DD-YYYY' = 'YYYY-MM-DD'
): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');

  switch (format) {
    case 'DD-MM-YYYY':
      return `${day}-${month}-${year}`;
    case 'MM-DD-YYYY':
      return `${month}-${day}-${year}`;
    case 'YYYY-MM-DD':
    default:
      return `${year}-${month}-${day}`;
  }
}