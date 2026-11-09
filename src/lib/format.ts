import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** Merge Tailwind class names, letting later classes override earlier ones. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const usd = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' });

export function money(n: number): string {
  return usd.format(n);
}

export function signedMoney(n: number): string {
  return `${n >= 0 ? '+' : '−'}${usd.format(Math.abs(n))}`;
}

export function pct(n: number, digits = 2): string {
  return `${n >= 0 ? '+' : '−'}${Math.abs(n).toFixed(digits)}%`;
}

export function compact(n: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 2 }).format(n);
}

/** Tailwind text colour for a gain/loss value. */
export function tone(n: number): string {
  if (n > 0) return 'text-up';
  if (n < 0) return 'text-down';
  return 'text-muted';
}

export function timeAgo(iso: string): string {
  const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}
