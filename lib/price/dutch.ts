export function currentDutchPrice(params: {
  startPrice: bigint;
  reservePrice: bigint;
  startMs: number;
  endMs: number;
  nowMs?: number;
}): bigint {
  const now = params.nowMs ?? Date.now();
  const span = Math.max(0, params.endMs - params.startMs);

  if (span === 0) return params.reservePrice;

  const t = Math.min(1, Math.max(0, (now - params.startMs) / span));
  const delta = Number(params.startPrice - params.reservePrice);

  return BigInt(Math.round(Number(params.reservePrice) + delta * (1 - t)));
}
