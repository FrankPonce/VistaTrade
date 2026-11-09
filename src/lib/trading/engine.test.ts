import { describe, expect, it } from 'vitest';
import {
  buyingPower,
  cancelOrder,
  equity,
  matchOpenOrders,
  newAccount,
  placeOrder,
  sellableShares,
  valuePositions,
  type Account,
} from './engine';

function mustPlace(...args: Parameters<typeof placeOrder>): Account {
  const result = placeOrder(...args);
  if (!result.ok) throw new Error(result.error);
  return result.account;
}

describe('market orders', () => {
  it('buys at the current price and moves cash into the position', () => {
    const acc = mustPlace(newAccount(10_000), { symbol: 'AAPL', side: 'buy', type: 'market', qty: 10 }, 200);
    expect(acc.cash).toBe(8_000);
    expect(acc.positions.AAPL).toEqual({ symbol: 'AAPL', qty: 10, avgCost: 200 });
    expect(acc.orders[0]).toMatchObject({ status: 'filled', fillPrice: 200 });
  });

  it('averages the cost across buys', () => {
    let acc = mustPlace(newAccount(), { symbol: 'AAPL', side: 'buy', type: 'market', qty: 10 }, 100);
    acc = mustPlace(acc, { symbol: 'AAPL', side: 'buy', type: 'market', qty: 10 }, 200);
    expect(acc.positions.AAPL.avgCost).toBe(150);
  });

  it('realizes profit on a sell and keeps the average cost of what is left', () => {
    let acc = mustPlace(newAccount(), { symbol: 'AAPL', side: 'buy', type: 'market', qty: 10 }, 100);
    acc = mustPlace(acc, { symbol: 'AAPL', side: 'sell', type: 'market', qty: 4 }, 125);
    expect(acc.realizedPnl).toBe(100);
    expect(acc.orders[0].realizedPnl).toBe(100);
    expect(acc.positions.AAPL).toMatchObject({ qty: 6, avgCost: 100 });
    expect(acc.cash).toBe(10_000 - 1_000 + 500);
  });

  it('removes the position when everything is sold', () => {
    let acc = mustPlace(newAccount(), { symbol: 'AAPL', side: 'buy', type: 'market', qty: 5 }, 100);
    acc = mustPlace(acc, { symbol: 'AAPL', side: 'sell', type: 'market', qty: 5 }, 90);
    expect(acc.positions.AAPL).toBeUndefined();
    expect(acc.realizedPnl).toBe(-50);
  });

  it('rejects buys you cannot afford, sells of shares you do not own, and bad quantities', () => {
    const acc = newAccount(1_000);
    expect(placeOrder(acc, { symbol: 'AAPL', side: 'buy', type: 'market', qty: 11 }, 100).ok).toBe(false);
    expect(placeOrder(acc, { symbol: 'AAPL', side: 'sell', type: 'market', qty: 1 }, 100).ok).toBe(false);
    expect(placeOrder(acc, { symbol: 'AAPL', side: 'buy', type: 'market', qty: 1.5 }, 100).ok).toBe(false);
    expect(placeOrder(acc, { symbol: 'AAPL', side: 'buy', type: 'market', qty: 0 }, 100).ok).toBe(false);
  });
});

describe('limit orders', () => {
  it('rests below the market and reserves cash', () => {
    const acc = mustPlace(newAccount(10_000), { symbol: 'MSFT', side: 'buy', type: 'limit', qty: 10, limitPrice: 90 }, 100);
    expect(acc.orders[0].status).toBe('open');
    expect(acc.cash).toBe(10_000);
    expect(buyingPower(acc)).toBe(9_100);
  });

  it('fills when the price drops to the limit, at the market price', () => {
    let acc = mustPlace(newAccount(), { symbol: 'MSFT', side: 'buy', type: 'limit', qty: 10, limitPrice: 90 }, 100);
    expect(matchOpenOrders(acc, { MSFT: 95 }).filled).toHaveLength(0);
    const result = matchOpenOrders(acc, { MSFT: 89.5 });
    acc = result.account;
    expect(result.filled).toHaveLength(1);
    expect(acc.positions.MSFT).toMatchObject({ qty: 10, avgCost: 89.5 });
    expect(buyingPower(acc)).toBe(acc.cash);
  });

  it('fills a marketable limit immediately at the better market price', () => {
    const acc = mustPlace(newAccount(), { symbol: 'MSFT', side: 'buy', type: 'limit', qty: 1, limitPrice: 120 }, 100);
    expect(acc.orders[0]).toMatchObject({ status: 'filled', fillPrice: 100 });
  });

  it('reserves shares for a resting sell limit and fills when the price rises', () => {
    let acc = mustPlace(newAccount(), { symbol: 'NVDA', side: 'buy', type: 'market', qty: 10 }, 100);
    acc = mustPlace(acc, { symbol: 'NVDA', side: 'sell', type: 'limit', qty: 6, limitPrice: 110 }, 100);
    expect(sellableShares(acc, 'NVDA')).toBe(4);
    expect(placeOrder(acc, { symbol: 'NVDA', side: 'sell', type: 'market', qty: 5 }, 100).ok).toBe(false);

    acc = matchOpenOrders(acc, { NVDA: 111 }).account;
    expect(acc.positions.NVDA.qty).toBe(4);
    expect(acc.realizedPnl).toBe(66);
  });

  it('releases the reservation when cancelled', () => {
    let acc = mustPlace(newAccount(10_000), { symbol: 'MSFT', side: 'buy', type: 'limit', qty: 10, limitPrice: 90 }, 100);
    acc = cancelOrder(acc, acc.orders[0].id);
    expect(acc.orders[0].status).toBe('cancelled');
    expect(buyingPower(acc)).toBe(10_000);
    expect(matchOpenOrders(acc, { MSFT: 1 }).filled).toHaveLength(0);
  });
});

describe('valuation', () => {
  it('computes unrealized P&L and equity from live prices', () => {
    const acc = mustPlace(newAccount(10_000), { symbol: 'AAPL', side: 'buy', type: 'market', qty: 10 }, 100);
    const [pos] = valuePositions(acc, { AAPL: 120 });
    expect(pos.unrealizedPnl).toBe(200);
    expect(pos.unrealizedPct).toBe(20);
    expect(equity(acc, { AAPL: 120 })).toBe(10_200);
  });
});
