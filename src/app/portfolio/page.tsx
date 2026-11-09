'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { PortfolioSummary } from '@/components/PortfolioSummary';
import { EquityChart } from '@/components/EquityChart';
import { PositionsTable } from '@/components/PositionsTable';
import { OrdersTable } from '@/components/OrdersTable';
import { useHydrated, useStore } from '@/lib/store';
import { useToasts } from '@/lib/toasts';
import { money } from '@/lib/format';

export default function PortfolioPage() {
  const hydrated = useHydrated();

  return (
    <div className="space-y-4 lg:space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Portfolio</h1>
          <p className="mt-1 text-sm text-muted">Virtual money only. Fills use the last price, with no fees or slippage.</p>
        </div>
        <ResetButton />
      </div>

      <Panel>
        <PortfolioSummary />
        <div className="mt-6">
          <EquityChart height="h-64" />
        </div>
      </Panel>

      {hydrated && (
        <>
          <Panel title="Positions">
            <PositionsTable />
          </Panel>
          <Panel title="Open orders">
            <OrdersTable status="open" />
          </Panel>
          <Panel title="Order history">
            <OrdersTable status="closed" />
          </Panel>
        </>
      )}
    </div>
  );
}

function ResetButton() {
  const [confirming, setConfirming] = useState(false);
  const reset = useStore((s) => s.resetAccount);
  const start = useStore((s) => s.account.startingCash);
  const push = useToasts((s) => s.push);

  if (!confirming) {
    return (
      <button className="btn-ghost" onClick={() => setConfirming(true)}>
        <RotateCcw className="h-4 w-4" /> Reset account
      </button>
    );
  }
  return (
    <div className="glass flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
      <span>Clear all trades and go back to {money(start)}? Lessons and achievements are kept.</span>
      <button
        className="btn-sell"
        onClick={() => {
          reset();
          setConfirming(false);
          push({ title: 'Account reset', body: `Back to ${money(start)} in cash.` });
        }}
      >
        Reset
      </button>
      <button className="btn-ghost" onClick={() => setConfirming(false)}>
        Keep my account
      </button>
    </div>
  );
}
