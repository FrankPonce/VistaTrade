'use client';

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useHydrated, useStore } from '@/lib/store';
import { usePortfolio } from '@/lib/usePortfolio';
import { money } from '@/lib/format';

export function EquityChart({ height = 'h-48' }: { height?: string }) {
  const hydrated = useHydrated();
  const history = useStore((s) => s.equityHistory);
  const { equity, account } = usePortfolio();

  // Need at least an hour of history before a line says anything.
  const spanMs = history.length > 0 ? Date.now() - history[0].t : 0;
  if (!hydrated || spanMs < 60 * 60_000) {
    return (
      <div className="flex h-28 items-center justify-center rounded-xl border border-dashed border-edge/20 px-4 text-center text-sm text-muted">
        {history.length === 0
          ? "Your portfolio's value over time appears here once you start trading."
          : 'Your value chart fills in as prices move. Check back after the next market session.'}
      </div>
    );
  }

  // Saved points plus a live "now" point, so the line always reaches the present.
  const data = [...history, { t: Date.now(), v: equity }];
  const up = equity >= account.startingCash;
  const color = up ? '#3CCFC6' : '#F0609E';

  return (
    <div className={height}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id="equity-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis dataKey="t" type="number" domain={['dataMin', 'dataMax']} hide />
          <YAxis domain={['auto', 'auto']} hide />
          <Tooltip
            cursor={{ stroke: '#9B6BFF', strokeOpacity: 0.4 }}
            contentStyle={{ background: 'rgba(20,12,30,0.92)', border: '1px solid rgba(155,107,255,0.3)', borderRadius: 12, fontSize: 12 }}
            labelStyle={{ color: '#9D94AA' }}
            labelFormatter={(t) => new Date(Number(t)).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
            formatter={(v) => [money(Number(v)), 'Value']}
          />
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#equity-fill)" isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
