// Finnhub (server only): company profile, key stats and news. Free plan,
// personal/non-commercial use. Docs: https://finnhub.io/docs/api
import 'server-only';

import type { NewsItem, StockDetails } from './types';

const BASE = 'https://finnhub.io/api/v1';

export function finnhubConfigured(): boolean {
  return Boolean(process.env.FINNHUB_API_KEY);
}

async function finnhubGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'X-Finnhub-Token': process.env.FINNHUB_API_KEY ?? '' },
    // Profiles and stats change slowly; let Next cache them for an hour.
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`Finnhub ${res.status} for ${path.split('?')[0]}`);
  return res.json() as Promise<T>;
}

interface Profile {
  name?: string;
  exchange?: string;
  finnhubIndustry?: string;
  logo?: string;
  weburl?: string;
  marketCapitalization?: number; // millions of USD
}
interface Metrics {
  metric?: {
    peTTM?: number;
    peNormalizedAnnual?: number;
    '52WeekHigh'?: number;
    '52WeekLow'?: number;
    currentDividendYieldTTM?: number;
    beta?: number;
  };
}
interface RawNews {
  id: number;
  headline: string;
  source: string;
  url: string;
  datetime: number; // unix seconds
  summary: string;
}

export async function finnhubDetails(symbol: string): Promise<Omit<StockDetails, 'symbol'>> {
  const s = encodeURIComponent(symbol);
  const today = new Date();
  const weekAgo = new Date(today.getTime() - 7 * 86_400_000);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  // Each call can fail on its own (e.g. ETFs have no profile); keep what works.
  const [profile, metrics, news] = await Promise.all([
    finnhubGet<Profile>(`/stock/profile2?symbol=${s}`).catch(() => ({} as Profile)),
    finnhubGet<Metrics>(`/stock/metric?symbol=${s}&metric=all`).catch(() => ({} as Metrics)),
    finnhubGet<RawNews[]>(`/company-news?symbol=${s}&from=${ymd(weekAgo)}&to=${ymd(today)}`).catch(() => []),
  ]);

  const m = metrics.metric ?? {};
  return {
    name: profile.name ?? symbol,
    exchange: profile.exchange,
    industry: profile.finnhubIndustry,
    logo: profile.logo || undefined,
    website: profile.weburl || undefined,
    marketCap: profile.marketCapitalization ? profile.marketCapitalization * 1_000_000 : undefined,
    peRatio: m.peTTM ?? m.peNormalizedAnnual,
    week52High: m['52WeekHigh'],
    week52Low: m['52WeekLow'],
    dividendYield: m.currentDividendYieldTTM,
    beta: m.beta,
    news: (Array.isArray(news) ? news : []).slice(0, 6).map(
      (n): NewsItem => ({
        id: String(n.id),
        headline: n.headline,
        source: n.source,
        url: n.url,
        datetime: new Date(n.datetime * 1000).toISOString(),
        summary: n.summary,
      })
    ),
  };
}
