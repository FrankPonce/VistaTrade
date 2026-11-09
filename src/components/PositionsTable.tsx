'use client';

import Link from 'next/link';
import { usePortfolio } from '@/lib/usePortfolio';
import { Change } from './ui/Change';
import { money } from '@/lib/format';

export function PositionsTable() {
  const { positions, weights } = usePortfolio();
  if (positions.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-muted">
        No positions yet.{' '}
        <Link href="/markets" className="text-vice-pink hover:underline">
          Find a stock to buy
        </Link>
        .
      </p>
    );
  }
  return (
    <div className="-mx-4 overflow-x-auto px-4 md:mx-0 md:px-0">
      <table className="w-full min-w-[560px] text-sm">
        <thead>
          <tr className="text-left text-xs text-muted">
            <th className="pb-2 font-normal">Stock</th>
            <th className="pb-2 text-right font-normal">Shares</th>
            <th className="pb-2 text-right font-normal">Avg cost</th>
            <th className="pb-2 text-right font-normal">Price</th>
            <th className="pb-2 text-right font-normal">Value</th>
            <th className="pb-2 text-right font-normal">Unrealized</th>
            <th className="pb-2 text-right font-normal">Weight</th>
          </tr>
        </thead>
        <tbody className="num divide-y divide-edge/10">
          {positions.map((p) => (
            <tr key={p.symbol}>
              <td className="py-2.5 font-medium">
                <Link href={`/stocks/${p.symbol}`} className="hover:text-vice-pink">
                  {p.symbol}
                </Link>
              </td>
              <td className="py-2.5 text-right">{p.qty}</td>
              <td className="py-2.5 text-right">{money(p.avgCost)}</td>
              <td className="py-2.5 text-right">{money(p.price)}</td>
              <td className="py-2.5 text-right">{money(p.marketValue)}</td>
              <td className="py-2.5 text-right">
                <Change value={p.unrealizedPnl} percent={p.unrealizedPct} />
              </td>
              <td className="py-2.5 text-right text-muted">{((weights[p.symbol] ?? 0) * 100).toFixed(1)}%</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
