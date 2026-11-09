// GET /api/search?q=app  ->  { results }
import { NextResponse, type NextRequest } from 'next/server';
import { searchSymbols } from '@/lib/market';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const q = (request.nextUrl.searchParams.get('q') ?? '').slice(0, 40);
  if (!q.trim()) return NextResponse.json({ results: [] });

  try {
    const results = await searchSymbols(q);
    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' } }
    );
  } catch (error) {
    console.error('search failed', error);
    return NextResponse.json({ error: 'Search is unavailable' }, { status: 502 });
  }
}
