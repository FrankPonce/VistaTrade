// GET /api/bars?symbol=AAPL&range=1M  ->  { source, bars }
import { NextResponse, type NextRequest } from 'next/server';
import { dataSource, getBars } from '@/lib/market';
import { RANGES, type Range } from '@/lib/market/types';
import { normaliseSymbol } from '@/lib/market/universe';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const symbol = normaliseSymbol(request.nextUrl.searchParams.get('symbol'));
  const range = request.nextUrl.searchParams.get('range') as Range;

  if (!symbol || !RANGES.includes(range)) {
    return NextResponse.json({ error: 'Pass a valid symbol and range' }, { status: 400 });
  }

  try {
    const bars = await getBars(symbol, range);
    const maxAge = range === '1D' ? 60 : 900;
    return NextResponse.json(
      { source: dataSource(), bars },
      { headers: { 'Cache-Control': `public, s-maxage=${maxAge}, stale-while-revalidate=${maxAge}` } }
    );
  } catch (error) {
    console.error('bars failed', error);
    return NextResponse.json({ error: 'Could not load chart data' }, { status: 502 });
  }
}
