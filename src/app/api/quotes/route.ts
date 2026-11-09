// GET /api/quotes?symbols=AAPL,MSFT  ->  { source, quotes }
import { NextResponse, type NextRequest } from 'next/server';
import { dataSource, getQuotes } from '@/lib/market';
import { normaliseSymbol } from '@/lib/market/universe';

export const dynamic = 'force-dynamic';

const MAX_SYMBOLS = 50;

export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('symbols') ?? '';
  const symbols = [...new Set(raw.split(',').map(normaliseSymbol).filter((s): s is string => s !== null))];

  if (symbols.length === 0 || symbols.length > MAX_SYMBOLS) {
    return NextResponse.json({ error: `Pass 1-${MAX_SYMBOLS} valid symbols` }, { status: 400 });
  }

  try {
    const quotes = await getQuotes(symbols);
    return NextResponse.json(
      { source: dataSource(), quotes },
      // Let a CDN serve the same answer to everyone for a few seconds.
      { headers: { 'Cache-Control': 'public, s-maxage=4, stale-while-revalidate=10' } }
    );
  } catch (error) {
    console.error('quotes failed', error);
    return NextResponse.json({ error: 'Could not load prices' }, { status: 502 });
  }
}
