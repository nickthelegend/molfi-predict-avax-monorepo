/** WebSocket channel helpers — must match leverx-server `stream.rs` encoding. */

export function orderbookChannel(args: {
  oracleId: string;
  expiryMs: number;
  strike: number;
  higherStrike?: number;
  isUp?: boolean;
  isRange?: boolean;
}): string {
  const higherStrike = args.higherStrike ?? 0;
  const isUp = args.isUp ?? true;
  const isRange = args.isRange ?? false;
  return `orderbook:${args.oracleId}:${args.expiryMs}:${args.strike}:${higherStrike}:${isUp ? 1 : 0}:${isRange ? 1 : 0}`;
}

export function globalTradesChannel(oracleId: string): string {
  return `trades:global:${oracleId}`;
}

export function positionsChannel(owner: string, oracleId?: string): string {
  return oracleId ? `positions:${owner}:${oracleId}` : `positions:${owner}`;
}

export function limitOrdersChannel(owner: string, oracleId?: string): string {
  return oracleId ? `limits:${owner}:${oracleId}` : `limits:${owner}`;
}
