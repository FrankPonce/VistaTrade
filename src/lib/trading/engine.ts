// The paper-trading engine: pure functions, no React, no storage, no network.
// Everything takes the current account and returns a new one, which makes the
// rules easy to read and to unit test (see engine.test.ts).
//
// Simplifications vs. a real broker (also explained in the Learn section):
// - Fills happen at the last traded price, with no spread, slippage or fees.
// - Whole shares only.
// - Orders fill whenever a price arrives, even outside market hours (the UI
//   warns when the market is closed and prices aren't moving).

export type Side = 'buy' | 'sell';
export type OrderType = 'market' | 'limit';
export type OrderStatus = 'open' | 'filled' | 'cancelled';

export interface Order {
  id: string;
  symbol: string;
  side: Side;
  type: OrderType;
  qty: number;
  /** Only for limit orders: the worst price you're willing to accept. */
  limitPrice?: number;
  status: OrderStatus;
  createdAt: string;
  filledAt?: string;
  fillPrice?: number;
  /** For sells: profit or loss locked in by this fill. */
  realizedPnl?: number;
}

export interface Position {
  symbol: string;
  qty: number;
  /** Average price paid per share for the shares still held. */
  avgCost: number;
}

export interface Account {
  startingCash: number;
  cash: number;
  positions: Record<string, Position>;
  orders: Order[]; // newest first
  realizedPnl: number;
}

export interface OrderRequest {
  symbol: string;
  side: Side;
  type: OrderType;
  qty: number;
  limitPrice?: number;
}

export type PlaceResult =
  | { ok: true; account: Account; order: Order }
  | { ok: false; error: string };

export const STARTING_CASH = 10_000;

export function newAccount(startingCash = STARTING_CASH): Account {
  return { startingCash, cash: startingCash, positions: {}, orders: [], realizedPnl: 0 };
}

const round2 = (n: number) => Math.round(n * 100) / 100;

let idCounter = 0;
function newId(): string {
  idCounter += 1;
  return `${Date.now().toString(36)}-${idCounter.toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

// ---------------------------------------------------------------------------
// Reservations: an open limit order "holds" cash (buys) or shares (sells),
// so you can't spend the same money twice.

export function reservedCash(account: Account): number {
  return account.orders
    .filter((o) => o.status === 'open' && o.side === 'buy')
    .reduce((sum, o) => sum + o.qty * (o.limitPrice ?? 0), 0);
}

export function reservedShares(account: Account, symbol: string): number {
  return account.orders
    .filter((o) => o.status === 'open' && o.side === 'sell' && o.symbol === symbol)
    .reduce((sum, o) => sum + o.qty, 0);
}

export function buyingPower(account: Account): number {
  return round2(account.cash - reservedCash(account));
}

export function sellableShares(account: Account, symbol: string): number {
  return (account.positions[symbol]?.qty ?? 0) - reservedShares(account, symbol);
}

// ---------------------------------------------------------------------------
// Fills

/** Apply a fill at `price` to the account. Assumes the order was validated. */
function fill(account: Account, order: Order, price: number, at: string): Account {
  const positions = { ...account.positions };
  const held = positions[order.symbol];
  let cash = account.cash;
  let realized = 0;

  if (order.side === 'buy') {
    const qty = (held?.qty ?? 0) + order.qty;
    const cost = (held ? held.qty * held.avgCost : 0) + order.qty * price;
    positions[order.symbol] = { symbol: order.symbol, qty, avgCost: cost / qty };
    cash -= order.qty * price;
  } else {
    // held is guaranteed by validation
    realized = (price - held!.avgCost) * order.qty;
    const qty = held!.qty - order.qty;
    if (qty === 0) delete positions[order.symbol];
    else positions[order.symbol] = { ...held!, qty }; // avg cost doesn't change on a sell
    cash += order.qty * price;
  }

  const filled: Order = {
    ...order,
    status: 'filled',
    filledAt: at,
    fillPrice: price,
    ...(order.side === 'sell' ? { realizedPnl: round2(realized) } : {}),
  };
  const others = account.orders.filter((o) => o.id !== order.id);

  return {
    ...account,
    cash: round2(cash),
    positions,
    orders: [filled, ...others],
    realizedPnl: round2(account.realizedPnl + realized),
  };
}

/** A limit order is "marketable" when the current price already satisfies it. */
function isMarketable(order: Pick<Order, 'side' | 'limitPrice'>, price: number): boolean {
  if (order.limitPrice === undefined) return true;
  return order.side === 'buy' ? price <= order.limitPrice : price >= order.limitPrice;
}

// ---------------------------------------------------------------------------
// Placing, matching and cancelling orders

export function placeOrder(account: Account, req: OrderRequest, currentPrice: number, now = new Date()): PlaceResult {
  if (!Number.isInteger(req.qty) || req.qty <= 0) return { ok: false, error: 'Quantity must be a whole number of shares.' };
  if (!(currentPrice > 0)) return { ok: false, error: 'No live price for this stock right now.' };
  if (req.type === 'limit' && !(req.limitPrice && req.limitPrice > 0)) {
    return { ok: false, error: 'Enter a limit price above zero.' };
  }

  const fillsNow = req.type === 'market' || isMarketable(req, currentPrice);

  if (req.side === 'buy') {
    // A resting limit buy reserves qty × limit; an immediate fill costs qty × current price.
    const needed = req.qty * (fillsNow ? currentPrice : req.limitPrice!);
    if (needed > buyingPower(account) + 1e-9) {
      return { ok: false, error: `Not enough buying power: this needs $${needed.toFixed(2)}.` };
    }
  } else if (req.qty > sellableShares(account, req.symbol)) {
    return { ok: false, error: `You can sell at most ${Math.max(0, sellableShares(account, req.symbol))} shares.` };
  }

  const order: Order = {
    id: newId(),
    symbol: req.symbol,
    side: req.side,
    type: req.type,
    qty: req.qty,
    ...(req.type === 'limit' ? { limitPrice: round2(req.limitPrice!) } : {}),
    status: 'open',
    createdAt: now.toISOString(),
  };

  if (fillsNow) {
    // Real brokers fill a marketable limit at the market price (which is
    // equal to or better than your limit), so we do the same.
    const next = fill({ ...account, orders: [order, ...account.orders] }, order, currentPrice, order.createdAt);
    return { ok: true, account: next, order: next.orders[0] };
  }
  return { ok: true, account: { ...account, orders: [order, ...account.orders] }, order };
}

/** Check every open limit order against fresh prices and fill the ones that trigger. */
export function matchOpenOrders(account: Account, prices: Record<string, number>, now = new Date()): { account: Account; filled: Order[] } {
  let next = account;
  const filled: Order[] = [];
  // Oldest first, like a real order book's time priority.
  const open = account.orders.filter((o) => o.status === 'open').reverse();

  for (const order of open) {
    const price = prices[order.symbol];
    if (!(price > 0) || !isMarketable(order, price)) continue;
    // A sell can no longer fill if the shares are gone (shouldn't happen thanks to reservations).
    if (order.side === 'sell' && (next.positions[order.symbol]?.qty ?? 0) < order.qty) continue;
    if (order.side === 'buy' && order.qty * price > next.cash + 1e-9) continue;
    next = fill(next, order, price, now.toISOString());
    filled.push(next.orders[0]);
  }
  return { account: next, filled };
}

export function cancelOrder(account: Account, orderId: string): Account {
  return {
    ...account,
    orders: account.orders.map((o) => (o.id === orderId && o.status === 'open' ? { ...o, status: 'cancelled' } : o)),
  };
}

// ---------------------------------------------------------------------------
// Valuation

export interface PositionView extends Position {
  price: number;
  marketValue: number;
  costBasis: number;
  unrealizedPnl: number;
  unrealizedPct: number;
}

export function valuePositions(account: Account, prices: Record<string, number>): PositionView[] {
  return Object.values(account.positions).map((p) => {
    const price = prices[p.symbol] ?? p.avgCost; // fall back to cost until a price arrives
    const marketValue = p.qty * price;
    const costBasis = p.qty * p.avgCost;
    const unrealizedPnl = marketValue - costBasis;
    return { ...p, price, marketValue, costBasis, unrealizedPnl, unrealizedPct: (unrealizedPnl / costBasis) * 100 };
  });
}

export function equity(account: Account, prices: Record<string, number>): number {
  return account.cash + valuePositions(account, prices).reduce((sum, p) => sum + p.marketValue, 0);
}
