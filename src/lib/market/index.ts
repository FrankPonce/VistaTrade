// The one place the API routes ask for market data. It picks the real provider
// when keys are configured and falls back to the simulated market otherwise,
// so the rest of the app never has to care which one is in use.
import 'server-only';

import { alpacaBars, alpacaConfigured, alpacaQuotes, alpacaSearch } from './alpaca';
import { finnhubConfigured, finnhubDetails } from './finnhub';
import { simulatedBars, simulatedQuote, simulatedSearch } from './simulated';
import type { Bar, DataSource, Quote, Range, StockDetails, SymbolInfo } from './types';
import { findInUniverse } from './universe';

export function dataSource(): DataSource {
  return alpacaConfigured() ? 'alpaca' : 'simulated';
}

// Short in-memory cache per symbol. On top of this, the API routes set
// Cache-Control headers so a CDN (e.g. Vercel's) can share responses
// across all visitors.
const QUOTE_TTL_MS = 4_000;
const quoteCache = new Map<string, { at: number; quote: Quote }>();

export async function getQuotes(symbols: string[]): Promise<Quote[]> {
  if (dataSource() === 'simulated') return symbols.map((s) => simulatedQuote(s));

  const now = Date.now();
  const fresh: Quote[] = [];
  const stale: string[] = [];
  for (const s of symbols) {
    const hit = quoteCache.get(s);
    if (hit && now - hit.at < QUOTE_TTL_MS) fresh.push(hit.quote);
    else stale.push(s);
  }
  if (stale.length > 0) {
    const fetched = await alpacaQuotes(stale);
    for (const q of fetched) quoteCache.set(q.symbol, { at: now, quote: q });
    fresh.push(...fetched);
  }
  // Return in the order requested.
  const bySymbol = new Map(fresh.map((q) => [q.symbol, q]));
  return symbols.flatMap((s) => bySymbol.get(s) ?? []);
}

export async function getBars(symbol: string, range: Range): Promise<Bar[]> {
  return dataSource() === 'simulated' ? simulatedBars(symbol, range) : alpacaBars(symbol, range);
}

export async function searchSymbols(query: string): Promise<SymbolInfo[]> {
  const results = dataSource() === 'simulated' ? simulatedSearch(query) : await alpacaSearch(query);
  // Attach our sector labels where we have them.
  return results.map((r) => ({ ...r, sector: findInUniverse(r.symbol)?.sector }));
}

export async function getDetails(symbol: string): Promise<StockDetails> {
  const known = findInUniverse(symbol);
  if (!finnhubConfigured()) {
    return { symbol, name: known?.name ?? symbol, industry: known?.sector, news: [] };
  }
  const details = await finnhubDetails(symbol);
  return { symbol, ...details, name: details.name || known?.name || symbol };
}
