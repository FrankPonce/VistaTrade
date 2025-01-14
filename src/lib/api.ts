// src/lib/api.ts
const FINNHUB_API_KEY = process.env.NEXT_PUBLIC_FINNHUB_API_KEY;

export async function fetchStockData(symbol: string) {
  try {
    const response = await fetch(
      `https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${FINNHUB_API_KEY}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Finnhub-Token': FINNHUB_API_KEY || ''
        }
      }
    );
    const data = await response.json();
    
    if (data.c && data.v) {
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
      `https://finnhub.io/api/v1/stock/candle?symbol=${symbol}&resolution=5&from=${from}&to=${to}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Finnhub-Token': FINNHUB_API_KEY || ''
        }
      }
    );
    const data = await response.json();

    if (data.s === 'ok' && data.c) {
      return data.t
        .map((timestamp: number, index: number) => ({
          time: new Date(timestamp * 1000).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit'
          }),
          price: parseFloat(data.c[index]),
          volume: parseFloat(data.v[index])
        }))
        .slice(-24);
    }
    throw new Error('Invalid API response');
  } catch (error) {
    console.error('API fetch error:', error);
    return null;
  }
}

// Add WebSocket functionality
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
