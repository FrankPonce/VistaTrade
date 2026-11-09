import type { SymbolInfo } from './types';

/**
 * The "tracked" stocks: shown on the markets page, offered as defaults, and
 * the set the forecasting model is trained on (see ml/config.py, keep in sync).
 * Any other US-listed stock can still be searched and traded when real data
 * is configured.
 */
export const UNIVERSE: SymbolInfo[] = [
  { symbol: 'AAPL', name: 'Apple', sector: 'Technology' },
  { symbol: 'MSFT', name: 'Microsoft', sector: 'Technology' },
  { symbol: 'NVDA', name: 'NVIDIA', sector: 'Technology' },
  { symbol: 'GOOGL', name: 'Alphabet', sector: 'Communication' },
  { symbol: 'META', name: 'Meta Platforms', sector: 'Communication' },
  { symbol: 'AMZN', name: 'Amazon', sector: 'Consumer' },
  { symbol: 'TSLA', name: 'Tesla', sector: 'Consumer' },
  { symbol: 'NFLX', name: 'Netflix', sector: 'Communication' },
  { symbol: 'DIS', name: 'Walt Disney', sector: 'Communication' },
  { symbol: 'NKE', name: 'Nike', sector: 'Consumer' },
  { symbol: 'KO', name: 'Coca-Cola', sector: 'Staples' },
  { symbol: 'WMT', name: 'Walmart', sector: 'Staples' },
  { symbol: 'JPM', name: 'JPMorgan Chase', sector: 'Financials' },
  { symbol: 'V', name: 'Visa', sector: 'Financials' },
  { symbol: 'JNJ', name: 'Johnson & Johnson', sector: 'Health Care' },
  { symbol: 'UNH', name: 'UnitedHealth', sector: 'Health Care' },
  { symbol: 'XOM', name: 'Exxon Mobil', sector: 'Energy' },
  { symbol: 'CAT', name: 'Caterpillar', sector: 'Industrials' },
  { symbol: 'SPY', name: 'S&P 500 ETF', sector: 'Index fund' },
  { symbol: 'QQQ', name: 'Nasdaq-100 ETF', sector: 'Index fund' },
];

export const DEFAULT_WATCHLIST = ['AAPL', 'NVDA', 'MSFT', 'TSLA', 'SPY'];

const bySymbol = new Map(UNIVERSE.map((s) => [s.symbol, s]));

export function findInUniverse(symbol: string): SymbolInfo | undefined {
  return bySymbol.get(symbol.toUpperCase());
}

/** Ticker symbols only: letters, digits, dot and dash (e.g. BRK.B). */
export const SYMBOL_PATTERN = /^[A-Z0-9.\-]{1,10}$/;

export function normaliseSymbol(raw: string | null | undefined): string | null {
  const s = (raw ?? '').trim().toUpperCase();
  return SYMBOL_PATTERN.test(s) ? s : null;
}
