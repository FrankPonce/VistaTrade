'use client';

import Link from 'next/link';
import { Star } from 'lucide-react';
import { useQuotes } from '@/lib/quotes';
import { useHydrated, useStore } from '@/lib/store';
import { findInUniverse } from '@/lib/market/universe';
import { Change } from './ui/Change';
import { money } from '@/lib/format';

/** Rows of symbol / price / day change. Used for the watchlist and the markets page. */
export function QuoteRows({ symbols, showName = true }: { symbols: string[]; showName?: boolean }) {
  const quotes = useQuotes((s) => s.quotes);
  const watchlist = useStore((s) => s.watchlist);
  const toggleWatch = useStore((s) => s.toggleWatch);

  return (
    <ul className="divide-y divide-edge/10">
      {symbols.map((symbol) => {
        const q = quotes[symbol];
        const watched = watchlist.includes(symbol);
        return (
          <li key={symbol} className="flex items-center gap-3 py-2.5">
            <button
              onClick={() => toggleWatch(symbol)}
              aria-label={watched ? `Remove ${symbol} from watchlist` : `Add ${symbol} to watchlist`}
              aria-pressed={watched}
              className="text-faint transition hover:text-vice-sunset"
            >
              <Star className={watched ? 'h-4 w-4 fill-vice-sunset text-vice-sunset' : 'h-4 w-4'} />
            </button>
            <Link href={`/stocks/${symbol}`} className="flex min-w-0 flex-1 items-center gap-3 rounded-lg hover:opacity-80">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{symbol}</p>
                {showName && <p className="truncate text-xs text-muted">{findInUniverse(symbol)?.name ?? ''}</p>}
              </div>
              <div className="text-right">
                <p className="num text-sm">{q ? money(q.price) : '—'}</p>
                <p className="text-xs">{q ? <Change percent={q.changePct} /> : <span className="text-faint">…</span>}</p>
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function Watchlist() {
  const hydrated = useHydrated();
  const watchlist = useStore((s) => s.watchlist);
  if (!hydrated) return <div className="h-40 animate-pulse rounded-xl bg-white/[0.03]" />;
  if (watchlist.length === 0) {
    return <p className="py-6 text-center text-sm text-muted">Star stocks on the Markets page to follow them here.</p>;
  }
  return <QuoteRows symbols={watchlist} />;
}
