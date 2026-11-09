// Price chart with 1D/1W/1M/1Y ranges, and volume bars underneath.
'use client';

import { useEffect, useState } from 'react';
import { Area, AreaChart, Bar as VolumeBar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { RANGES, type Bar, type Range } from '@/lib/market/types';
import { useStore } from '@/lib/store';
import { cn, compact, money, pct } from '@/lib/format';

function formatTick(iso: string, range: Range) {
  const d = new Date(iso);
  if (range === '1D') return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
  if (range === '1W') return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function PriceChart({ symbol, livePrice }: { symbol: string; livePrice?: number }) {
  const [range, setRange] = useState<Range>('1M');
  const [bars, setBars] = useState<Bar[] | null>(null);
  const [error, setError] = useState(false);
  const setFlag = useStore((s) => s.setFlag);

  useEffect(() => {
    let cancelled = false;
    setBars(null);
    setError(false);
    fetch(`/api/bars?symbol=${symbol}&range=${range}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => !cancelled && setBars(d.bars))
      .catch(() => !cancelled && setError(true));
    if (range === '1Y') setFlag('viewed1Y');
    return () => {
      cancelled = true;
    };
  }, [symbol, range, setFlag]);

  const points = (bars ?? []).map((b) => ({ t: b.t, price: b.c, volume: b.v }));
  // Bars stop 15 minutes ago on the free plan; append the live price so the line reaches "now".
  if (livePrice && points.length > 0 && range === '1D') {
    points.push({ t: new Date().toISOString(), price: livePrice, volume: 0 });
  }

  const first = points[0]?.price;
  const last = points[points.length - 1]?.price;
  const up = first === undefined || last >= first;
  const color = up ? '#3CCFC6' : '#F0609E';
  const gradientId = `fill-${symbol}-${range}`;

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-sm text-muted">
          {first !== undefined && last !== undefined && (
            <>
              <span className={up ? 'text-up' : 'text-down'}>{pct(((last - first) / first) * 100)}</span> over {range}
            </>
          )}
        </p>
        <div className="flex rounded-xl border border-edge/20 bg-black/30 p-0.5" role="tablist" aria-label="Chart range">
          {RANGES.map((r) => (
            <button
              key={r}
              role="tab"
              aria-selected={r === range}
              onClick={() => setRange(r)}
              className={cn('rounded-lg px-3 py-1 text-xs font-medium transition', r === range ? 'bg-white/10 text-text' : 'text-muted hover:text-text')}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <div className="h-64 md:h-80">
        {error ? (
          <p className="flex h-full items-center justify-center text-sm text-muted">Couldn&apos;t load chart data.</p>
        ) : !bars ? (
          <div className="h-full animate-pulse rounded-xl bg-white/[0.03]" />
        ) : points.length < 2 ? (
          <p className="flex h-full items-center justify-center text-sm text-muted">Not enough data for this range yet.</p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={points} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="t" tickFormatter={(t) => formatTick(t, range)} tick={{ fill: '#5E566B', fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={40} />
              <YAxis domain={['auto', 'auto']} orientation="right" tick={{ fill: '#5E566B', fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v) => `$${Number(v).toFixed(v >= 100 ? 0 : 2)}`} />
              <Tooltip
                cursor={{ stroke: '#9B6BFF', strokeOpacity: 0.4 }}
                contentStyle={{ background: 'rgba(20,12,30,0.92)', border: '1px solid rgba(155,107,255,0.3)', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#9D94AA' }}
                labelFormatter={(t) => new Date(String(t)).toLocaleString([], { dateStyle: 'medium', timeStyle: range === '1D' || range === '1W' ? 'short' : undefined })}
                formatter={(v) => [money(Number(v)), 'Price']}
              />
              <Area type="monotone" dataKey="price" stroke={color} strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {bars && points.length > 1 && (
        <div className="mt-1 h-14">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={points} margin={{ top: 0, right: 56, bottom: 0, left: 0 }}>
              <XAxis dataKey="t" hide />
              <Tooltip cursor={false} content={() => null} />
              <VolumeBar dataKey="volume" fill="#9B6BFF" fillOpacity={0.35} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
          <p className="sr-only">Volume bars below the price chart. Latest volume {compact(points[points.length - 1].volume)}.</p>
        </div>
      )}
    </div>
  );
}
