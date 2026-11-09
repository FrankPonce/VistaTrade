// Buy/sell form for one stock: market or limit, whole shares.
'use client';

import { useState } from 'react';
import { buyingPower, sellableShares, type OrderType, type Side } from '@/lib/trading/engine';
import { useStore } from '@/lib/store';
import { useToasts } from '@/lib/toasts';
import { isMarketOpen } from '@/lib/marketHours';
import { cn, money } from '@/lib/format';

export function OrderTicket({ symbol, price }: { symbol: string; price?: number }) {
  const account = useStore((s) => s.account);
  const placeOrder = useStore((s) => s.placeOrder);
  const pushToast = useToasts((s) => s.push);

  const [side, setSide] = useState<Side>('buy');
  const [type, setType] = useState<OrderType>('market');
  const [qty, setQty] = useState('1');
  const [limit, setLimit] = useState('');
  const [error, setError] = useState<string | null>(null);

  const shares = Number(qty);
  const limitPrice = Number(limit);
  const estPrice = type === 'limit' && limitPrice > 0 ? limitPrice : price ?? 0;
  const estTotal = shares > 0 ? shares * estPrice : 0;
  const power = buyingPower(account);
  const sellable = sellableShares(account, symbol);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!price) return setError('Waiting for a live price…');
    const result = placeOrder({ symbol, side, type, qty: shares, limitPrice: type === 'limit' ? limitPrice : undefined }, price);
    if (!result.ok) return setError(result.error);

    setError(null);
    const o = result.order;
    pushToast(
      o.status === 'filled'
        ? { title: `${o.side === 'buy' ? 'Bought' : 'Sold'} ${o.qty} ${o.symbol}`, body: `Filled at ${money(o.fillPrice!)}`, tone: o.side === 'buy' ? 'up' : 'down' }
        : { title: `Limit ${o.side} placed`, body: `${o.qty} ${o.symbol} at ${money(o.limitPrice!)}. It fills if the price gets there.`, tone: 'brand' }
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {/* Buy / Sell */}
      <div className="grid grid-cols-2 gap-1 rounded-xl border border-edge/20 bg-black/30 p-1">
        {(['buy', 'sell'] as Side[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSide(s)}
            className={cn(
              'rounded-lg py-2 text-sm font-medium capitalize transition',
              side === s ? (s === 'buy' ? 'bg-vice-teal text-black' : 'bg-vice-pink text-black') : 'text-muted hover:text-text'
            )}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Market / Limit */}
      <div className="flex gap-2 text-sm">
        {(['market', 'limit'] as OrderType[]).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              if (t === 'limit' && !limit && price) setLimit(price.toFixed(2));
            }}
            className={cn('chip capitalize', type === t && 'border-vice-purple/60 text-text')}
          >
            {t}
          </button>
        ))}
      </div>

      <label className="block">
        <span className="label">Shares</span>
        <input className="input num mt-1" type="number" inputMode="numeric" min={1} step={1} value={qty} onChange={(e) => setQty(e.target.value)} />
      </label>

      {type === 'limit' && (
        <label className="block">
          <span className="label">Limit price</span>
          <input className="input num mt-1" type="number" inputMode="decimal" min={0.01} step={0.01} value={limit} onChange={(e) => setLimit(e.target.value)} />
          <span className="mt-1 block text-xs text-muted">
            {side === 'buy' ? 'Buys at this price or lower.' : 'Sells at this price or higher.'}
          </span>
        </label>
      )}

      <dl className="space-y-1.5 rounded-xl bg-black/30 p-3 text-sm">
        <div className="flex justify-between">
          <dt className="text-muted">Market price</dt>
          <dd className="num">{price ? money(price) : '—'}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">Estimated {side === 'buy' ? 'cost' : 'proceeds'}</dt>
          <dd className="num">{money(estTotal)}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-muted">{side === 'buy' ? 'Buying power' : 'Shares you can sell'}</dt>
          <dd className="num">{side === 'buy' ? money(power) : sellable}</dd>
        </div>
      </dl>

      {error && <p className="text-sm text-vice-pink" role="alert">{error}</p>}

      <button type="submit" className={cn('w-full', side === 'buy' ? 'btn-buy' : 'btn-sell')} disabled={!price}>
        {side === 'buy' ? 'Buy' : 'Sell'} {symbol}
      </button>

      {price && !isMarketOpen() && (
        <p className="text-xs text-faint">The market is closed, so orders fill at the last traded price.</p>
      )}
    </form>
  );
}
