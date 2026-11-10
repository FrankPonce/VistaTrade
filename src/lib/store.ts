// App state, saved in the browser's localStorage (one paper account per browser).
//
// Zustand keeps this small: state and the actions that change it live together,
// and `persist` handles saving/loading. The trading rules themselves live in
// lib/trading/engine.ts; this file only wires them to state.
'use client';

import { useEffect, useState } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  cancelOrder,
  matchOpenOrders,
  newAccount,
  placeOrder,
  type Account,
  type Order,
  type OrderRequest,
  type PlaceResult,
} from '@/lib/trading/engine';
import { DEFAULT_WATCHLIST } from '@/lib/market/universe';

export interface EquityPoint {
  t: number; // ms timestamp
  v: number; // portfolio value
}

interface SavedState {
  account: Account;
  watchlist: string[];
  equityHistory: EquityPoint[];
  completedLessons: Record<string, string>; // slug -> ISO date
  quizScores: Record<string, { score: number; total: number }>;
  achievements: Record<string, string>; // id -> ISO date unlocked
  /** One-off events that lessons and achievements check, e.g. "viewedForecasts". */
  flags: Record<string, boolean>;
}

interface Actions {
  placeOrder: (req: OrderRequest, price: number) => PlaceResult;
  cancelOrder: (orderId: string) => void;
  /** Called on every price update; returns any limit orders that just filled. */
  matchOrders: (prices: Record<string, number>) => Order[];
  toggleWatch: (symbol: string) => void;
  recordEquity: (value: number) => void;
  completeLesson: (slug: string) => void;
  recordQuiz: (slug: string, score: number, total: number) => void;
  unlock: (ids: string[]) => void;
  setFlag: (flag: string) => void;
  resetAccount: () => void;
}

function initialState(): SavedState {
  return {
    account: newAccount(),
    watchlist: DEFAULT_WATCHLIST,
    equityHistory: [],
    completedLessons: {},
    quizScores: {},
    achievements: {},
    flags: {},
  };
}

// Keep the equity curve light: at most one point per 15 minutes, last ~2 years.
const EQUITY_INTERVAL_MS = 15 * 60_000;
const EQUITY_MAX_POINTS = 70_000;

export const useStore = create<SavedState & Actions>()(
  persist(
    (set, get) => ({
      ...initialState(),

      placeOrder: (req, price) => {
        const result = placeOrder(get().account, req, price);
        if (result.ok) {
          set({ account: result.account });
          // Make sure the portfolio curve shows the starting point.
          if (get().equityHistory.length === 0) get().recordEquity(get().account.startingCash);
        }
        return result;
      },

      cancelOrder: (orderId) => set({ account: cancelOrder(get().account, orderId) }),

      matchOrders: (prices) => {
        const { account, filled } = matchOpenOrders(get().account, prices);
        if (filled.length > 0) set({ account });
        return filled;
      },

      toggleWatch: (symbol) => {
        const list = get().watchlist;
        set({
          watchlist: list.includes(symbol) ? list.filter((s) => s !== symbol) : [...list, symbol],
          flags: { ...get().flags, watchlistEdited: true },
        });
      },

      recordEquity: (value) => {
        const history = get().equityHistory;
        const now = Date.now();
        const last = history[history.length - 1];
        if (last && now - last.t < EQUITY_INTERVAL_MS) {
          // Update the latest point instead of adding a new one.
          set({ equityHistory: [...history.slice(0, -1), { t: last.t, v: value }] });
        } else {
          set({ equityHistory: [...history, { t: now, v: value }].slice(-EQUITY_MAX_POINTS) });
        }
      },

      completeLesson: (slug) => {
        if (get().completedLessons[slug]) return;
        set({ completedLessons: { ...get().completedLessons, [slug]: new Date().toISOString() } });
      },

      recordQuiz: (slug, score, total) => {
        const best = get().quizScores[slug];
        if (best && best.score >= score) return;
        set({ quizScores: { ...get().quizScores, [slug]: { score, total } } });
      },

      unlock: (ids) => {
        const now = new Date().toISOString();
        const next = { ...get().achievements };
        ids.forEach((id) => (next[id] ??= now));
        set({ achievements: next });
      },

      setFlag: (flag) => {
        if (!get().flags[flag]) set({ flags: { ...get().flags, [flag]: true } });
      },

      // Resets money and trades. Lesson progress and achievements are kept,
      // since you earned those by learning, not by trading.
      resetAccount: () => set({ account: newAccount(), equityHistory: [] }),
    }),
    { name: 'vistatrade:v2', version: 1 }
  )
);

// Keep tabs in sync: when another tab saves, reload its state here instead of
// overwriting it with this tab's stale copy on the next price tick.
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === useStore.persist.getOptions().name) useStore.persist.rehydrate();
  });
}

/** True once saved state has loaded from localStorage, so we don't flash default values. */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return useStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);
  return hydrated;
}
