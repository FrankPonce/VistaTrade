// Forecasts: the model's predictions, always shown next to the baselines
// and its own backtest record. The point is honesty, not hype.
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { Panel } from '@/components/ui/Panel';
import { ForecastRange } from '@/components/ForecastRange';
import { useForecasts, type Horizon, type HorizonBacktest } from '@/lib/forecasts';
import { findInUniverse } from '@/lib/market/universe';
import { useStore } from '@/lib/store';
import { cn } from '@/lib/format';

export default function ForecastsPage() {
  const { data, error } = useForecasts();
  const setFlag = useStore((s) => s.setFlag);
  const [horizon, setHorizon] = useState<Horizon>('1');

  useEffect(() => setFlag('viewedForecasts'), [setFlag]);

  return (
    <div className="space-y-4 lg:space-y-5">
      <div>
        <h1 className="text-2xl font-semibold">Forecasts</h1>
        <p className="mt-1 max-w-3xl text-sm text-muted">
          A machine-learning model predicts each stock&apos;s return over the next 1 and 5 trading days, with a range
          for how wrong it might be. Read the scorecard first: short-term prices are close to unpredictable, and this
          model is roughly as good as a coin with a slight upward lean.{' '}
          <Link href="/learn/what-models-can-know" className="text-vice-pink hover:underline">
            Why?
          </Link>
        </p>
      </div>

      {error && <Panel><p className="text-sm text-muted">Forecasts haven&apos;t been published yet.</p></Panel>}
      {!data && !error && <div className="h-64 animate-pulse rounded-panel bg-white/[0.03]" />}

      {data && (
        <>
          {data.sample && (
            <div className="glass flex items-start gap-3 border-l-2 border-l-vice-sunset p-4 text-sm">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-vice-sunset" />
              <p>
                <span className="font-medium">Sample data.</span>{' '}
                <span className="text-muted">
                  These numbers come from a test run on simulated random-walk prices, not real market data. Real
                  forecasts appear after the first scheduled run.
                </span>
              </p>
            </div>
          )}

          <div className="flex items-center gap-2">
            {(['1', '5'] as Horizon[]).map((h) => (
              <button key={h} onClick={() => setHorizon(h)} className={cn('chip', horizon === h && 'border-vice-purple/60 bg-vice-purple/10 text-text')}>
                Next {h === '1' ? 'day' : '5 days'}
              </button>
            ))}
          </div>

          <Scorecard bt={data.backtest.horizons[horizon]} horizon={horizon} start={data.backtest.start} end={data.backtest.end} folds={data.backtest.folds} />

          <Panel title={`Forecasts · data through ${data.dataThrough}`}>
            <ul className="divide-y divide-edge/10">
              {data.forecasts.map((f) => (
                <li key={f.symbol} className="grid grid-cols-[5rem_1fr] items-center gap-4 py-3 sm:grid-cols-[10rem_1fr]">
                  <Link href={`/stocks/${f.symbol}`} className="min-w-0 hover:text-vice-pink">
                    <p className="text-sm font-medium">{f.symbol}</p>
                    <p className="hidden truncate text-xs text-muted sm:block">{findInUniverse(f.symbol)?.name}</p>
                  </Link>
                  <ForecastRange f={f.horizons[horizon]} scale={horizon === '1' ? 4 : 8} />
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-faint">
              Dot: the model&apos;s median guess. Purple band: the range it expects the outcome to fall in 80% of the
              time. Grey tick: no change. Generated {new Date(data.generatedAt).toLocaleString()}.
            </p>
          </Panel>

          <Panel title="How the model works">
            <div className="prose-lesson text-sm">
              <p>
                <strong>{data.model.name}.</strong> One model is trained on all stocks together, using only information
                available at each day&apos;s close: recent returns, volatility, volume, RSI, distance from moving
                averages, and what the overall market (SPY) did.
              </p>
              <p>{data.model.notes}</p>
              <p>
                Baselines are scored on exactly the same days: <strong>no change</strong> predicts a 0% return;{' '}
                <strong>always up</strong> predicts the average past return, so it always says &ldquo;up&rdquo;.
              </p>
            </div>
          </Panel>
        </>
      )}
    </div>
  );
}

function Scorecard({ bt, horizon, start, end, folds }: { bt: HorizonBacktest & { edgeVsAlwaysUpCI95?: [number, number] }; horizon: Horizon; start: string; end: string; folds: number }) {
  const ci = bt.edgeVsAlwaysUpCI95;
  const beatsDirection = ci ? ci[0] > 0 : false;
  const beatsMae = bt.model.mae < Math.min(bt.baselines.noChange.mae, bt.baselines.alwaysUp.mae);

  return (
    <Panel title={`Backtest scorecard · ${horizon === '1' ? 'next day' : 'next 5 days'}`}>
      <div className="grid gap-4 md:grid-cols-2">
        <MetricBars
          label="Direction right (higher is better)"
          rows={[
            ['Model', bt.model.directionAcc, true],
            ['Always up', bt.baselines.alwaysUp.directionAcc, false],
            ['Coin flip', 0.5, false],
          ]}
          format={(v) => `${(v * 100).toFixed(1)}%`}
          min={0.45}
          max={0.58}
        />
        <MetricBars
          label="Average error (lower is better)"
          rows={[
            ['Model', bt.model.mae, true],
            ['No change', bt.baselines.noChange.mae, false],
            ['Always up', bt.baselines.alwaysUp.mae, false],
          ]}
          format={(v) => `${(v * 100).toFixed(2)}%`}
          min={0}
          max={Math.max(bt.model.mae, bt.baselines.noChange.mae) * 1.15}
        />
      </div>

      <div className="mt-5 grid gap-3 text-sm sm:grid-cols-3">
        <Verdict ok={beatsDirection} text={beatsDirection ? 'Beats "always up" on direction, beyond noise' : 'Does not reliably beat "always up" on direction'} />
        <Verdict ok={beatsMae} text={beatsMae ? 'Lower average error than both baselines' : 'No lower error than the baselines'} />
        <Verdict ok={Math.abs(bt.intervalCoverage - 0.8) < 0.05} text={`Range caught ${(bt.intervalCoverage * 100).toFixed(0)}% of outcomes (aim: 80%)`} />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-faint">
        {bt.n.toLocaleString()} out-of-sample predictions from {start} to {end}, across {folds} walk-forward folds.
        {ci && (
          <>
            {' '}95% interval for the model&apos;s direction edge over &ldquo;always up&rdquo;: {(ci[0] * 100).toFixed(1)} to{' '}
            {(ci[1] * 100).toFixed(1)} points (block bootstrap by date).
          </>
        )}
      </p>
    </Panel>
  );
}

function MetricBars({ label, rows, format, min, max }: { label: string; rows: [string, number, boolean][]; format: (v: number) => string; min: number; max: number }) {
  return (
    <div>
      <p className="mb-3 text-xs text-muted">{label}</p>
      <ul className="space-y-2.5">
        {rows.map(([name, value, isModel]) => (
          <li key={name} className="grid grid-cols-[5.5rem_1fr_4.5rem] items-center gap-3 text-sm">
            <span className={isModel ? 'font-medium' : 'text-muted'}>{name}</span>
            <div className="h-2 overflow-hidden rounded-full bg-white/[0.05]">
              <div
                className={cn('h-full rounded-full', isModel ? 'bg-gradient-to-r from-vice-purple to-vice-pink' : 'bg-white/25')}
                style={{ width: `${Math.max(2, Math.min(100, ((value - min) / (max - min)) * 100))}%` }}
              />
            </div>
            <span className="num text-right">{format(value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Verdict({ ok, text }: { ok: boolean; text: string }) {
  return (
    <p className={cn('rounded-xl border px-3 py-2', ok ? 'border-vice-teal/30 text-vice-teal' : 'border-edge/15 text-muted')}>{text}</p>
  );
}
