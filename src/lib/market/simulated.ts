// Simulated market used when no API keys are configured (local dev, demos).
//
// Prices are a deterministic random walk: the same symbol at the same moment
// gives the same price on every server and browser, so the app behaves
// consistently even without a real data feed. The UI always labels this data
// as simulated.

import type { Bar, Quote, Range } from './types';
import { UNIVERSE } from './universe';

const BASE_PRICES: Record<string, number> = {
  AAPL: 225, MSFT: 430, NVDA: 135, GOOGL: 175, META: 560, AMZN: 195, TSLA: 250,
  NFLX: 700, DIS: 95, NKE: 80, KO: 63, WMT: 80, JPM: 220, V: 290, JNJ: 155,
  UNH: 560, XOM: 115, CAT: 380, SPY: 570, QQQ: 490,
};

/** Small, fast, seedable PRNG (mulberry32). */
function rng(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(text: string): number {
  let h = 2166136261;
  for (const ch of text) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return h >>> 0;
}

const DAY_MS = 86_400_000;
const STEP_MS = 5 * 60_000; // one simulated tick every 5 minutes

/** Price of `symbol` at time `ms`, built from daily and intraday random walks. */
function priceAt(symbol: string, ms: number): number {
  const base = BASE_PRICES[symbol] ?? 50 + (hash(symbol) % 300);
  const vol = symbol === 'TSLA' || symbol === 'NVDA' ? 0.028 : symbol.length <= 3 && symbol.startsWith('Q') ? 0.012 : 0.016;

  // Daily walk: sum of daily shocks over the past ~400 days.
  const today = Math.floor(ms / DAY_MS);
  let logPrice = Math.log(base);
  for (let d = today - 400; d < today; d++) {
    const r = rng(hash(symbol) ^ d);
    logPrice += vol * (r() + r() + r() - 1.5) * 1.15 + 0.0003;
  }
  // Intraday walk for today, in 5-minute steps.
  const steps = Math.floor((ms - today * DAY_MS) / STEP_MS);
  const r = rng(hash(symbol) ^ (today * 7919));
  for (let s = 0; s < steps; s++) logPrice += (vol / 17) * (r() + r() + r() - 1.5) * 1.15;

  return Math.round(Math.exp(logPrice) * 100) / 100;
}

export function simulatedQuote(symbol: string, now = Date.now()): Quote {
  const price = priceAt(symbol, now);
  const prevClose = priceAt(symbol, Math.floor(now / DAY_MS) * DAY_MS - 1);
  const change = price - prevClose;
  const baseVolume = 2_000_000 + (hash(symbol) % 40_000_000);
  const dayFraction = (now % DAY_MS) / DAY_MS;
  return {
    symbol,
    price,
    prevClose,
    change,
    changePct: (change / prevClose) * 100,
    volume: Math.round(baseVolume * dayFraction),
    time: new Date(now).toISOString(),
  };
}

const RANGE_CONFIG: Record<Range, { spanMs: number; stepMs: number }> = {
  '1D': { spanMs: DAY_MS, stepMs: STEP_MS },
  '1W': { spanMs: 7 * DAY_MS, stepMs: 60 * 60_000 },
  '1M': { spanMs: 30 * DAY_MS, stepMs: DAY_MS },
  '1Y': { spanMs: 365 * DAY_MS, stepMs: DAY_MS },
};

export function simulatedBars(symbol: string, range: Range, now = Date.now()): Bar[] {
  const { spanMs, stepMs } = RANGE_CONFIG[range];
  const bars: Bar[] = [];
  const start = Math.floor((now - spanMs) / stepMs) * stepMs;
  let prev = priceAt(symbol, start);
  for (let t = start + stepMs; t <= now; t += stepMs) {
    const c = priceAt(symbol, Math.min(t, now));
    const spread = Math.abs(c - prev) + c * 0.002;
    bars.push({
      t: new Date(t - stepMs).toISOString(),
      o: prev,
      h: Math.max(prev, c) + spread * 0.3,
      l: Math.min(prev, c) - spread * 0.3,
      c,
      v: 50_000 + (hash(symbol + t) % 900_000),
    });
    prev = c;
  }
  return bars;
}

export function simulatedSearch(query: string) {
  const q = query.trim().toUpperCase();
  return UNIVERSE.filter((s) => s.symbol.startsWith(q) || s.name.toUpperCase().includes(q)).slice(0, 10);
}
