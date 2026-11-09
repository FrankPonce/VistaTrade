'use client';

import { usePortfolio } from '@/lib/usePortfolio';
import { useHydrated } from '@/lib/store';
import { Change } from './ui/Change';
import { money } from '@/lib/format';

export function PortfolioSummary() {
  const hydrated = useHydrated();
  const p = usePortfolio();
  if (!hydrated) return <div className="h-24 animate-pulse rounded-xl bg-white/[0.03]" />;

  return (
    <div>
      <p className="label">Portfolio value</p>
      <p className="num mt-1 text-4xl font-semibold tracking-tight md:text-5xl">{money(p.equity)}</p>
      <p className="mt-1 text-sm">
        <Change value={p.totalReturn} percent={p.totalReturnPct} /> <span className="text-muted">all time</span>
      </p>
      <dl className="mt-5 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <Stat label="Today" value={<Change value={p.todayPnl} />} />
        <Stat label="Cash" value={money(p.account.cash)} />
        <Stat label="Unrealized P&L" value={<Change value={p.unrealizedPnl} />} />
        <Stat label="Realized P&L" value={<Change value={p.realizedPnl} />} />
      </dl>
    </div>
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
