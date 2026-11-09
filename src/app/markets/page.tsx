// Markets: every tracked stock, filterable by sector, plus search for anything else.
'use client';

import { useMemo, useState } from 'react';
import { Panel } from '@/components/ui/Panel';
import { QuoteRows } from '@/components/Watchlist';
import { SymbolSearch } from '@/components/SymbolSearch';
import { UNIVERSE } from '@/lib/market/universe';
import { useQuotes } from '@/lib/quotes';
import { cn } from '@/lib/format';

type Sort = 'symbol' | 'gainers' | 'losers';

export default function MarketsPage() {
  const quotes = useQuotes((s) => s.quotes);
  const [sector, setSector] = useState<string>('All');
  const [sort, setSort] = useState<Sort>('symbol');

  const sectors = ['All', ...new Set(UNIVERSE.map((s) => s.sector!))];

  const symbols = useMemo(() => {
    const list = UNIVERSE.filter((s) => sector === 'All' || s.sector === sector).map((s) => s.symbol);
    const change = (s: string) => quotes[s]?.changePct ?? 0;
    if (sort === 'gainers') list.sort((a, b) => change(b) - change(a));
    if (sort === 'losers') list.sort((a, b) => change(a) - change(b));
    return list;
  }, [sector, sort, quotes]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Markets</h1>
        <p className="mt-1 text-sm text-muted">Popular US stocks and index funds. Star any of them to add it to your watchlist.</p>
      </div>

      <div className="md:hidden">
        <SymbolSearch />
      </div>

      <Panel>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          {sectors.map((s) => (
            <button key={s} onClick={() => setSector(s)} className={cn('chip', sector === s && 'border-vice-purple/60 bg-vice-purple/10 text-text')}>
              {s}
            </button>
          ))}
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as Sort)}
            className="ml-auto rounded-lg border border-edge/25 bg-black/40 px-2 py-1 text-xs text-text"
            aria-label="Sort"
          >
            <option value="symbol">A-Z</option>
            <option value="gainers">Top gainers</option>
            <option value="losers">Top losers</option>
          </select>
        </div>
        <QuoteRows symbols={symbols} />
      </Panel>
    </div>
  );
}
