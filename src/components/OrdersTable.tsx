'use client';

import { useStore } from '@/lib/store';
import { Change } from './ui/Change';
import { cn, money } from '@/lib/format';

export function OrdersTable({ status, symbol }: { status: 'open' | 'closed'; symbol?: string }) {
  const orders = useStore((s) => s.account.orders);
  const cancel = useStore((s) => s.cancelOrder);

  const rows = orders.filter(
    (o) => (status === 'open' ? o.status === 'open' : o.status !== 'open') && (!symbol || o.symbol === symbol)
  );

  if (rows.length === 0) {
    return <p className="py-4 text-center text-sm text-muted">{status === 'open' ? 'No open orders.' : 'No order history yet.'}</p>;
  }

  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="pb-2 font-normal">Date</th>
            <th className="pb-2 font-normal">Order</th>
            <th className="pb-2 text-right font-normal">Shares</th>
            <th className="pb-2 text-right font-normal">{status === 'open' ? 'Limit' : 'Price'}</th>
            <th className="pb-2 text-right font-normal">{status === 'open' ? '' : 'Realized'}</th>
          </tr>
        </thead>
        <tbody className="num divide-y divide-edge/10">
          {rows.map((o) => {
            const shownPrice = status === 'open' ? o.limitPrice : o.fillPrice ?? o.limitPrice;
            return (
              <tr key={o.id}>
                <td className="py-2.5 text-muted">
                  {new Date(o.filledAt ?? o.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                </td>
                <td className="py-2.5">
                  <span className={cn('font-medium capitalize', o.side === 'buy' ? 'text-up' : 'text-down')}>{o.side}</span>{' '}
                  <span className="font-medium">{o.symbol}</span>{' '}
                  <span className="text-muted">
                    {o.type}
                    {o.status === 'cancelled' ? ' (cancelled)' : ''}
                  </span>
                </td>
                <td className="py-2.5 text-right">{o.qty}</td>
                <td className="py-2.5 text-right">{shownPrice !== undefined ? money(shownPrice) : '—'}</td>
                <td className="py-2.5 text-right">
                  {status === 'open' ? (
                    <button onClick={() => cancel(o.id)} className="text-xs text-muted underline-offset-2 hover:text-vice-pink hover:underline">
                      Cancel
                    </button>
                  ) : o.realizedPnl !== undefined ? (
                    <Change value={o.realizedPnl} />
                  ) : (
                    <span className="text-faint">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
