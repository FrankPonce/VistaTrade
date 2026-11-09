// Alpaca market data (server only). Free "Basic" plan:
// - Live prices come from the IEX exchange only (a slice of US volume), so they
//   can differ by a few cents from the consolidated price.
// - Historical bars from the full market (SIP feed) are allowed as long as we
//   don't ask for the most recent 15 minutes.
// Docs: https://docs.alpaca.markets/docs/about-market-data-api
import 'server-only';

import type { Bar, Quote, Range, SymbolInfo } from './types';

const DATA_URL = 'https://data.alpaca.markets/v2';
const TRADING_URL = 'https://paper-api.alpaca.markets/v2';

export function alpacaConfigured(): boolean {
  return Boolean(process.env.ALPACA_KEY_ID && process.env.ALPACA_SECRET_KEY);
}

async function alpacaGet<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'APCA-API-KEY-ID': process.env.ALPACA_KEY_ID ?? '',
      'APCA-API-SECRET-KEY': process.env.ALPACA_SECRET_KEY ?? '',
    },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Alpaca ${res.status} for ${url.split('?')[0]}`);
  return res.json() as Promise<T>;
}

interface AlpacaBar { t: string; o: number; h: number; l: number; c: number; v: number }
interface AlpacaSnapshot {
  latestTrade?: { p: number; t: string };
  dailyBar?: AlpacaBar;
  prevDailyBar?: AlpacaBar;
}

/** One request returns snapshots for every symbol, which keeps us far below rate limits. */
export async function alpacaQuotes(symbols: string[]): Promise<Quote[]> {
  const url = `${DATA_URL}/stocks/snapshots?feed=iex&symbols=${symbols.map(encodeURIComponent).join(',')}`;
  const data = await alpacaGet<Record<string, AlpacaSnapshot | null>>(url);

  return symbols.flatMap((symbol) => {
    const snap = data[symbol];
    const price = snap?.latestTrade?.p ?? snap?.dailyBar?.c;
    const prevClose = snap?.prevDailyBar?.c;
    if (!snap || price === undefined || prevClose === undefined) return [];
    const change = price - prevClose;
    return [{
      symbol,
      price,
      prevClose,
      change,
      changePct: (change / prevClose) * 100,
      volume: snap.dailyBar?.v ?? 0,
      time: snap.latestTrade?.t ?? snap.dailyBar?.t ?? new Date().toISOString(),
    }];
  });
}

const DAY_MS = 86_400_000;
const RANGE_QUERY: Record<Range, { timeframe: string; lookbackMs: number }> = {
  // Look back 4 days for "1D" so a Monday morning still finds Friday's session;
  // we then keep only the most recent trading day.
  '1D': { timeframe: '5Min', lookbackMs: 4 * DAY_MS },
  '1W': { timeframe: '1Hour', lookbackMs: 7 * DAY_MS },
  '1M': { timeframe: '1Day', lookbackMs: 31 * DAY_MS },
  '1Y': { timeframe: '1Day', lookbackMs: 366 * DAY_MS },
};

export async function alpacaBars(symbol: string, range: Range): Promise<Bar[]> {
  const { timeframe, lookbackMs } = RANGE_QUERY[range];
  const now = Date.now();
  // Free plan: full-market (SIP) bars must end at least 15 minutes ago.
  const end = new Date(now - 16 * 60_000).toISOString();
  const start = new Date(now - lookbackMs).toISOString();

  const bars: AlpacaBar[] = [];
  let pageToken: string | undefined;
  do {
    const url =
      `${DATA_URL}/stocks/${encodeURIComponent(symbol)}/bars?feed=sip&adjustment=all&limit=10000` +
      `&timeframe=${timeframe}&start=${start}&end=${end}` +
      (pageToken ? `&page_token=${pageToken}` : '');
    const page = await alpacaGet<{ bars: AlpacaBar[] | null; next_page_token: string | null }>(url);
    bars.push(...(page.bars ?? []));
    pageToken = page.next_page_token ?? undefined;
  } while (pageToken);

  if (range === '1D' && bars.length > 0) {
    // Keep only the last trading day (dates compared in New York time).
    const nyDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { timeZone: 'America/New_York' });
    const lastDay = nyDate(bars[bars.length - 1].t);
    return bars.filter((b) => nyDate(b.t) === lastDay);
  }
  return bars;
}

// The full list of tradable US stocks is ~11k rows and changes rarely, so it's
// fetched once and cached in memory for a day.
let assetCache: { at: number; assets: SymbolInfo[] } | null = null;

async function allAssets(): Promise<SymbolInfo[]> {
  if (assetCache && Date.now() - assetCache.at < DAY_MS) return assetCache.assets;
  const rows = await alpacaGet<{ symbol: string; name: string; tradable: boolean }[]>(
    `${TRADING_URL}/assets?status=active&asset_class=us_equity`
  );
  const assets = rows.filter((r) => r.tradable).map((r) => ({ symbol: r.symbol, name: r.name }));
  assetCache = { at: Date.now(), assets };
  return assets;
}

export async function alpacaSearch(query: string): Promise<SymbolInfo[]> {
  const q = query.trim().toUpperCase();
  if (!q) return [];
  const assets = await allAssets();
  // Exact ticker first, then tickers starting with the query, then name matches.
  const exact = assets.filter((a) => a.symbol === q);
  const prefix = assets.filter((a) => a.symbol !== q && a.symbol.startsWith(q));
  const byName = assets.filter((a) => !a.symbol.startsWith(q) && a.name.toUpperCase().includes(q));
  return [...exact, ...prefix.sort((a, b) => a.symbol.length - b.symbol.length), ...byName].slice(0, 10);
}
