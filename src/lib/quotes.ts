// Live prices in the browser. One poller (components/LivePrices.tsx) fetches
// every symbol the app currently cares about in a single request, and every
// component reads prices from this store. Not saved: prices are always fresh.
'use client';

import { create } from 'zustand';
import type { DataSource, Quote } from '@/lib/market/types';

interface QuotesState {
  quotes: Record<string, Quote>;
  source: DataSource | null;
  error: string | null;
  updatedAt: number | null;
  /** Extra symbols a page wants priced (e.g. the stock page you're on). */
  focus: Record<string, number>;
  setQuotes: (quotes: Quote[], source: DataSource) => void;
  setError: (error: string) => void;
  addFocus: (symbol: string) => () => void;
}

export const useQuotes = create<QuotesState>()((set, get) => ({
  quotes: {},
  source: null,
  error: null,
  updatedAt: null,
  focus: {},

  setQuotes: (list, source) =>
    set({
      quotes: { ...get().quotes, ...Object.fromEntries(list.map((q) => [q.symbol, q])) },
      source,
      error: null,
      updatedAt: Date.now(),
    }),

  setError: (error) => set({ error }),

  // Reference-counted so two components focusing the same symbol don't clash.
  addFocus: (symbol) => {
    set({ focus: { ...get().focus, [symbol]: (get().focus[symbol] ?? 0) + 1 } });
    return () => {
      const focus = { ...get().focus };
      focus[symbol] = (focus[symbol] ?? 1) - 1;
      if (focus[symbol] <= 0) delete focus[symbol];
      set({ focus });
    };
  },
}));

/** Just the prices, as { AAPL: 228.41, ... }. */
export function pricesOf(quotes: Record<string, Quote>): Record<string, number> {
  return Object.fromEntries(Object.values(quotes).map((q) => [q.symbol, q.price]));
}
