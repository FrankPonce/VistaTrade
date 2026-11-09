// GET /api/stock/AAPL  ->  company profile, key stats and recent news
import { NextResponse } from 'next/server';
import { getDetails } from '@/lib/market';
import { normaliseSymbol } from '@/lib/market/universe';

export async function GET(_request: Request, { params }: { params: Promise<{ symbol: string }> }) {
  const symbol = normaliseSymbol((await params).symbol);
  if (!symbol) return NextResponse.json({ error: 'Invalid symbol' }, { status: 400 });

  try {
    const details = await getDetails(symbol);
    return NextResponse.json(details, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('details failed', error);
    return NextResponse.json({ error: 'Could not load company details' }, { status: 502 });
  }
}
