// src/app/api/stock-proxy/route.ts

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const endpoint = searchParams.get('endpoint');
  const symbol = searchParams.get('symbol');
  const from = searchParams.get('from');
  const to = searchParams.get('to');
  const resolution = searchParams.get('resolution');

  let url = '';

  switch (endpoint) {
    case 'quote':
      url = `https://finnhub.io/api/v1/quote?symbol=${symbol}`;
      break;
    case 'candle':
      url = `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=${resolution}&from=${from}&to=${to}`;
      break;
    default:
      return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'X-Finnhub-Token': FINNHUB_API_KEY || '',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json({ error: error.error }, { status: response.status });
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
  }
}
