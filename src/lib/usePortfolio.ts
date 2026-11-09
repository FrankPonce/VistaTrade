// Derived portfolio numbers from saved state + live prices, used across pages.
'use client';

import { useMemo } from 'react';
import { buyingPower, valuePositions } from '@/lib/trading/engine';
import { pricesOf, useQuotes } from '@/lib/quotes';
import { useStore } from '@/lib/store';

export function usePortfolio() {
  const account = useStore((s) => s.account);
  const quotes = useQuotes((s) => s.quotes);

  return useMemo(() => {
    const prices = pricesOf(quotes);
    const positions = valuePositions(account, prices).sort((a, b) => b.marketValue - a.marketValue);
    const invested = positions.reduce((s, p) => s + p.marketValue, 0);
    const equity = account.cash + invested;
    const unrealizedPnl = positions.reduce((s, p) => s + p.unrealizedPnl, 0);

    // Today's move on what you hold now. Shares held since before today are
    // measured from yesterday's close; shares bought today from their fill price.
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const todayPnl = positions.reduce((s, p) => {
      const q = quotes[p.symbol];
      if (!q) return s;
      let boughtToday = 0;
      let boughtTodayCost = 0;
      for (const o of account.orders) {
        if (o.symbol !== p.symbol || o.side !== 'buy' || o.status !== 'filled') continue;
        if (new Date(o.filledAt!) < startOfDay) continue;
        const qty = Math.min(o.qty, p.qty - boughtToday);
        if (qty <= 0) break;
        boughtToday += qty;
        boughtTodayCost += qty * o.fillPrice!;
      }
      const older = p.qty - boughtToday;
      return s + older * (q.price - q.prevClose) + (boughtToday * q.price - boughtTodayCost);
    }, 0);

    const weights = Object.fromEntries(positions.map((p) => [p.symbol, equity > 0 ? p.marketValue / equity : 0]));

    return {
      account,
      positions,
      invested,
      equity,
      unrealizedPnl,
      realizedPnl: account.realizedPnl,
      totalReturn: equity - account.startingCash,
      totalReturnPct: ((equity - account.startingCash) / account.startingCash) * 100,
      todayPnl,
      buyingPower: buyingPower(account),
      weights,
    };
  }, [account, quotes]);
}
