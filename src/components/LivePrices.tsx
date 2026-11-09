// Invisible component mounted once in the layout. Every few seconds it:
//   1. fetches prices for everything the app needs, in one request,
//   2. fills any limit orders those prices trigger,
//   3. records the portfolio's value for the "value over time" chart.
'use client';

import { useEffect, useMemo } from 'react';
import { equity } from '@/lib/trading/engine';
import { UNIVERSE } from '@/lib/market/universe';
import { pricesOf, useQuotes } from '@/lib/quotes';
import { useHydrated, useStore } from '@/lib/store';
import { useToasts } from '@/lib/toasts';
import { money } from '@/lib/format';
import type { DataSource, Quote } from '@/lib/market/types';

const POLL_MS = 5_000;

export function LivePrices() {
  const hydrated = useHydrated();
  const watchlist = useStore((s) => s.watchlist);
  const positions = useStore((s) => s.account.positions);
  const orders = useStore((s) => s.account.orders);
  const focus = useQuotes((s) => s.focus);

  // Everything we need a price for, as one stable comma-separated key.
  const symbolsKey = useMemo(() => {
    const set = new Set<string>(UNIVERSE.map((s) => s.symbol));
    watchlist.forEach((s) => set.add(s));
    Object.keys(positions).forEach((s) => set.add(s));
    orders.filter((o) => o.status === 'open').forEach((o) => set.add(o.symbol));
    Object.keys(focus).forEach((s) => set.add(s));
    return [...set].sort().slice(0, 50).join(',');
  }, [watchlist, positions, orders, focus]);

  useEffect(() => {
    if (!hydrated) return;
    let cancelled = false;

    async function tick() {
      if (document.visibilityState === 'hidden') return; // don't poll in background tabs
      try {
        const res = await fetch(`/api/quotes?symbols=${symbolsKey}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: { source: DataSource; quotes: Quote[] } = await res.json();
        if (cancelled) return;

        useQuotes.getState().setQuotes(data.quotes, data.source);
        const prices = pricesOf(useQuotes.getState().quotes);

        const filled = useStore.getState().matchOrders(prices);
        filled.forEach((o) =>
          useToasts.getState().push({
            title: `Limit ${o.side} filled`,
            body: `${o.qty} ${o.symbol} at ${money(o.fillPrice!)}`,
            tone: o.side === 'buy' ? 'up' : 'down',
          })
        );

        const { account, equityHistory, recordEquity } = useStore.getState();
        // Only start the curve once there's been at least one trade.
        if (account.orders.length > 0 || equityHistory.length > 0) recordEquity(equity(account, prices));
      } catch {
        if (!cancelled) useQuotes.getState().setError('Live prices are unavailable right now.');
      }
    }

    tick();
    const timer = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => {
      cancelled = true;
      clearInterval(timer);
      document.removeEventListener('visibilitychange', tick);
    };
  }, [hydrated, symbolsKey]);

  return null;
}
