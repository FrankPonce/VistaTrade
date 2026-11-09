// Shapes shared by the server data layer, API routes and the UI.

export type Range = '1D' | '1W' | '1M' | '1Y';
export const RANGES: Range[] = ['1D', '1W', '1M', '1Y'];

/** Where the numbers came from. Shown in the UI so nobody mistakes fake data for real. */
export type DataSource = 'alpaca' | 'simulated';

export interface Quote {
  symbol: string;
  price: number;
  prevClose: number;
  change: number;
  changePct: number;
  /** Today's volume so far. */
  volume: number;
  /** ISO timestamp of the last trade. */
  time: string;
}

export interface Bar {
  /** ISO timestamp of the bar's start. */
  t: string;
  o: number;
  h: number;
  l: number;
  c: number;
  v: number;
}

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  url: string;
  datetime: string;
  summary: string;
}

export interface StockDetails {
  symbol: string;
  name: string;
  exchange?: string;
  industry?: string;
  logo?: string;
  website?: string;
  marketCap?: number; // in USD
  peRatio?: number;
  week52High?: number;
  week52Low?: number;
  dividendYield?: number; // percent
  beta?: number;
  news: NewsItem[];
}

export interface SymbolInfo {
  symbol: string;
  name: string;
  sector?: string;
}
