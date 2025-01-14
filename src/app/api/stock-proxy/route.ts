// app/api/stock-proxy/route.ts
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
  
    // Map the requested endpoint to the Finnhub API
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
  
      // Check if the response is okay
      if (!response.ok) {
        const error = await response.json();
        return NextResponse.json({ error: error.error }, { status: response.status });
      }
  
      const data = await response.json();
      return NextResponse.json(data);
    } catch (error) {
      console.error('Error fetching data:', error);
      return NextResponse.json({ error: 'Failed to fetch data' }, { status: 500 });
    }
  }

// Client-side functions
export async function fetchStockData(symbol: string) {
  try {
    const response = await fetch(`/api/stock-proxy?endpoint=quote&symbol=${symbol}`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    
    if (data?.c && data?.v) {
      return {
        price: parseFloat(data.c),
        volume: parseFloat(data.v)
      };
    }
    throw new Error('Invalid API response');
  } catch (error) {
    console.error('API fetch error:', error);
    return null;
  }
}

export async function fetchIntradayData(symbol: string) {
    try {
      const to = Math.floor(Date.now() / 1000);
      const from = to - 7200; // 2 hours ago
  
      const response = await fetch(
        `/api/stock-proxy?endpoint=candle&symbol=${symbol}&resolution=5&from=${from}&to=${to}`
      );
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
  
      // Debug log to see what we're getting
      console.log('Raw candle data:', data);
  
      // Check if we have valid data structure
      if (data?.c && Array.isArray(data.c) && data.t && Array.isArray(data.t)) {
        const formattedData = data.t.map((timestamp: number, index: number) => ({
          time: new Date(timestamp * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          price: parseFloat(data.c[index] || 0),
          volume: parseFloat(data.v?.[index] || 0),
          // Add fill colors for better visualization
          fill: `hsl(var(--chart-${(index % 6) + 1}))`
        }));
  
        // Take last 24 points or pad with previous value if we have fewer points
        const lastPoint = formattedData[formattedData.length - 1];
        const paddedData = Array(24).fill(null).map((_, idx) => {
          if (idx < formattedData.length) {
            return formattedData[formattedData.length - 1 - idx];
          }
          return {
            ...lastPoint,
            time: new Date(Date.now() - (idx * 5 * 60 * 1000))
              .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
        }).reverse();
  
        return paddedData;
      }
      
      // If we don't have valid data, generate some placeholder data
      const basePrice = 150; // or get this from somewhere
      const now = Date.now();
      return Array(24).fill(null).map((_, idx) => ({
        time: new Date(now - ((23 - idx) * 5 * 60 * 1000))
          .toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        price: basePrice + (Math.random() * 10 - 5),
        volume: 500000 + (Math.random() * 100000),
        fill: `hsl(var(--chart-${(idx % 6) + 1}))`
      }));
  
    } catch (error) {
      console.error('API fetch error:', error);
      return null;
    }
}
  

// WebSocket handling
let ws: WebSocket | null = null;
let wsSubscriptions: string[] = [];

export function connectWebSocket(symbol: string, onPriceUpdate: (data: any) => void) {
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    ws = new WebSocket('wss://ws.finnhub.io?token=' + FINNHUB_API_KEY);

    ws.onopen = () => {
      console.log('WebSocket Connected');
      if (symbol && !wsSubscriptions.includes(symbol)) {
        ws?.send(JSON.stringify({ 'type': 'subscribe', 'symbol': symbol }));
        wsSubscriptions.push(symbol);
      }
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'trade') {
        onPriceUpdate(data.data[0]);
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('WebSocket Disconnected');
      wsSubscriptions = [];
    };
  } else if (!wsSubscriptions.includes(symbol)) {
    ws.send(JSON.stringify({ 'type': 'subscribe', 'symbol': symbol }));
    wsSubscriptions.push(symbol);
  }

  return () => {
    if (ws && wsSubscriptions.includes(symbol)) {
      ws.send(JSON.stringify({ 'type': 'unsubscribe', 'symbol': symbol }));
      wsSubscriptions = wsSubscriptions.filter(s => s !== symbol);
    }
  };
}

export function disconnectWebSocket() {
  if (ws) {
    ws.close();
    ws = null;
    wsSubscriptions = [];
  }
}
