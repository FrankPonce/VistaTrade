// One stock: live price, chart, order ticket, your position, key stats,
// the model's forecast (if this stock is tracked) and recent news.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ExternalLink, Star } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { Change } from '@/components/ui/Change';
import { PriceChart } from '@/components/PriceChart';
import { OrderTicket } from '@/components/OrderTicket';
import { OrdersTable } from '@/components/OrdersTable';
import { ForecastRange } from '@/components/ForecastRange';
import { useQuotes } from '@/lib/quotes';
import { useHydrated, useStore } from '@/lib/store';
import { usePortfolio } from '@/lib/usePortfolio';
import { useForecasts } from '@/lib/forecasts';
import { findInUniverse } from '@/lib/market/universe';
import type { StockDetails } from '@/lib/market/types';
import { compact, money, timeAgo } from '@/lib/format';

export function StockView({ symbol }: { symbol: string }) {
  const hydrated = useHydrated();
  const quote = useQuotes((s) => s.quotes[symbol]);
  const addFocus = useQuotes((s) => s.addFocus);
  const watched = useStore((s) => s.watchlist.includes(symbol));
  const toggleWatch = useStore((s) => s.toggleWatch);
  const [details, setDetails] = useState<StockDetails | null>(null);

  // Make sure the live poller includes this symbol while the page is open.
  useEffect(() => addFocus(symbol), [symbol, addFocus]);

  useEffect(() => {
    fetch(`/api/stock/${symbol}`)
      .then((r) => (r.ok ? r.json() : null))
      .then(setDetails)
      .catch(() => setDetails(null));
  }, [symbol]);

  const name = details?.name ?? findInUniverse(symbol)?.name ?? symbol;

  return (
    <div className="space-y-4 lg:space-y-5">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex items-center gap-3">
          {details?.logo && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={details.logo} alt="" className="h-11 w-11 rounded-xl bg-white object-contain p-1" />
          )}
          <div>
            <p className="text-sm text-muted">
              {symbol}
              {details?.exchange && <> · {details.exchange.split(' ')[0]}</>}
            </p>
            <h1 className="text-2xl font-semibold">{name}</h1>
          </div>
        </div>
        <div className="flex items-end gap-4">
          <div className="text-right">
            <p className="num text-3xl font-semibold">{quote ? money(quote.price) : '—'}</p>
            <p className="text-sm">{quote && <Change value={quote.change} percent={quote.changePct} />} <span className="text-muted">today</span></p>
          </div>
          <button onClick={() => toggleWatch(symbol)} className="btn-ghost" aria-pressed={hydrated && watched}>
            <Star className={hydrated && watched ? 'h-4 w-4 fill-vice-sunset text-vice-sunset' : 'h-4 w-4'} />
            <span className="hidden sm:inline">{hydrated && watched ? 'Watching' : 'Watch'}</span>
          </button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-3 lg:gap-5">
        <Panel className="lg:col-span-2">
          <PriceChart symbol={symbol} livePrice={quote?.price} />
        </Panel>

        <Panel title="Trade">
          <OrderTicket symbol={symbol} price={quote?.price} />
        </Panel>

        <div className="space-y-4 lg:col-span-2 lg:space-y-5">
          <YourPosition symbol={symbol} />
          <KeyStats details={details} volume={quote?.volume} />
          <News details={details} />
        </div>

        <div className="space-y-4 lg:space-y-5">
          <SymbolForecast symbol={symbol} />
          {hydrated && (
            <Panel title="Open orders">
              <OrdersTable status="open" symbol={symbol} />
            </Panel>
          )}
        </div>
      </div>
    </div>
  );
}

function YourPosition({ symbol }: { symbol: string }) {
  const hydrated = useHydrated();
  const { positions, weights } = usePortfolio();
  const p = positions.find((x) => x.symbol === symbol);
  if (!hydrated || !p) return null;
  return (
    <Panel title="Your position">
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <Stat label="Shares" value={p.qty} />
        <Stat label="Avg cost" value={money(p.avgCost)} />
        <Stat label="Market value" value={money(p.marketValue)} />
        <Stat label="Unrealized" value={<Change value={p.unrealizedPnl} percent={p.unrealizedPct} />} />
      </dl>
      <p className="mt-3 text-xs text-muted">{((weights[symbol] ?? 0) * 100).toFixed(1)}% of your portfolio</p>
    </Panel>
  );
}

function KeyStats({ details, volume }: { details: StockDetails | null; volume?: number }) {
  const stats: [string, string | undefined][] = [
    ['Market cap', details?.marketCap ? `$${compact(details.marketCap)}` : undefined],
    ['P/E ratio', details?.peRatio?.toFixed(1)],
    ['52-week high', details?.week52High ? money(details.week52High) : undefined],
    ['52-week low', details?.week52Low ? money(details.week52Low) : undefined],
    ['Dividend yield', details?.dividendYield !== undefined ? `${details.dividendYield.toFixed(2)}%` : undefined],
    ['Beta', details?.beta?.toFixed(2)],
    ['Volume today', volume ? compact(volume) : undefined],
    ['Industry', details?.industry],
  ];
  const shown = stats.filter(([, v]) => v);
  if (shown.length === 0) return null;
  return (
    <Panel title="Key stats">
      <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        {shown.map(([label, value]) => (
          <Stat key={label} label={label} value={value} />
        ))}
      </dl>
    </Panel>
  );
}

function News({ details }: { details: StockDetails | null }) {
  if (!details?.news.length) return null;
  return (
    <Panel title="News">
      <ul className="divide-y divide-edge/10">
        {details.news.map((n) => (
          <li key={n.id} className="py-3">
            <a href={n.url} target="_blank" rel="noopener noreferrer" className="group block">
              <p className="text-sm font-medium group-hover:text-vice-pink">
                {n.headline} <ExternalLink className="inline h-3 w-3 text-faint" />
              </p>
              <p className="mt-1 text-xs text-muted">
                {n.source} · {timeAgo(n.datetime)}
              </p>
            </a>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function SymbolForecast({ symbol }: { symbol: string }) {
  const { data } = useForecasts();
  const f = data?.forecasts.find((x) => x.symbol === symbol);
  if (!data || !f) return null;
  return (
    <Panel title="Model forecast" action={<Link href="/forecasts" className="text-xs text-muted hover:text-text">How good is it?</Link>}>
      <div className="space-y-4">
        <div>
          <p className="mb-1 text-xs text-muted">Next trading day</p>
          <ForecastRange f={f.horizons['1']} scale={4} />
        </div>
        <div>
          <p className="mb-1 text-xs text-muted">Next 5 trading days</p>
          <ForecastRange f={f.horizons['5']} scale={8} />
        </div>
        <p className="text-xs leading-relaxed text-faint">
          {data.sample ? 'Sample data: the model has not run yet. ' : ''}
          In backtests this model is only about as accurate as simple baselines. Treat the range, not the dot, as the
          message.
        </p>
      </div>
    </Panel>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-muted">{label}</dt>
      <dd className="num mt-0.5 font-medium">{value}</dd>
    </div>
  );
}
