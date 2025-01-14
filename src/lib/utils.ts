import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);
};

export const calculatePercentageChange = (
  currentValue: number,
  previousValue: number
): number => {
  return ((currentValue - previousValue) / previousValue) * 100;
};

export const generateMockStockData = (basePrice: number) => {
  const variation = basePrice * 0.1; // 10% variation
  return basePrice + (Math.random() * variation * 2) - variation;
};
