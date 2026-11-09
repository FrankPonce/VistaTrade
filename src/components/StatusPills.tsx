// Small honesty indicators: is the market open, and is this data real?
'use client';

import { useEffect, useState } from 'react';
import { isMarketOpen } from '@/lib/marketHours';
import { useQuotes } from '@/lib/quotes';
import { cn } from '@/lib/format';

export function MarketStatus() {
  const [open, setOpen] = useState<boolean | null>(null);
  useEffect(() => {
    const update = () => setOpen(isMarketOpen());
    update();
    const t = setInterval(update, 60_000);
    return () => clearInterval(t);
  }, []);
  if (open === null) return null;
  return (
    <span className="chip" title="Regular US session, 9:30-16:00 New York time. Holidays not included.">
      <span className={cn('h-1.5 w-1.5 rounded-full', open ? 'bg-vice-teal shadow-[0_0_6px_#3CCFC6]' : 'bg-faint')} />
      {open ? 'Market open' : 'Market closed'}
    </span>
  );
}

/** Site-wide strip shown only when prices are simulated, so it's never mistaken for real data. */
export function SimulatedBanner() {
  const source = useQuotes((s) => s.source);
  if (source !== 'simulated') return null;
  return (
    <div className="border-b border-vice-sunset/20 bg-vice-sunset/[0.06] px-4 py-1.5 text-center text-xs text-vice-sunset">
      Simulated prices: no market data keys are configured, so prices are generated, not real.
    </div>
  );
}

export function DataSourcePill() {
  const source = useQuotes((s) => s.source);
  const error = useQuotes((s) => s.error);
  if (error) return <span className="chip border-vice-pink/40 text-vice-pink">Prices offline</span>;
  if (source === 'simulated')
    return (
      <span className="chip border-vice-sunset/40 text-vice-sunset" title="No market data keys configured, so prices are simulated.">
        Simulated prices
      </span>
    );
  if (source === 'alpaca')
    return (
      <span className="chip" title="Live prices from the IEX exchange via Alpaca. May differ slightly from the consolidated market price.">
        Live · IEX
      </span>
    );
  return null;
}
