export function currentDutchPrice(params: {
  startPriceWei: bigint;
  reservePriceWei: bigint;
  startMs: number;
  endMs: number;
  nowMs?: number;
}): bigint {
  const now = params.nowMs ?? Date.now();
  const span = Math.max(0, params.endMs - params.startMs);
  
  if (span === 0) return params.reservePriceWei;
  
  const t = Math.min(1, Math.max(0, (now - params.startMs) / span));
  const delta = Number(params.startPriceWei - params.reservePriceWei);
  
  return BigInt(Math.round(Number(params.reservePriceWei) + delta * (1 - t)));
}
