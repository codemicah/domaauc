import { describe, it, expect } from 'vitest';
import { currentDutchPrice } from '@/lib/price/dutch';

describe('currentDutchPrice', () => {
  const startPriceWei = BigInt('1000000000000000000'); // 1 ETH
  const reservePriceWei = BigInt('100000000000000000'); // 0.1 ETH
  const startMs = 1000000;
  const endMs = 2000000; // 1000 second duration

  it('should return start price when now <= start time', () => {
    const nowMs = startMs - 100;
    const result = currentDutchPrice({
      startPriceWei,
      reservePriceWei,
      startMs,
      endMs,
      nowMs,
    });
    expect(result).toBe(startPriceWei);
  });

  it('should return reserve price when now >= end time', () => {
    const nowMs = endMs + 100;
    const result = currentDutchPrice({
      startPriceWei,
      reservePriceWei,
      startMs,
      endMs,
      nowMs,
    });
    expect(result).toBe(reservePriceWei);
  });

  it('should return midpoint price at midpoint time', () => {
    const nowMs = (startMs + endMs) / 2;
    const expectedPrice = (startPriceWei + reservePriceWei) / BigInt(2);
    const result = currentDutchPrice({
      startPriceWei,
      reservePriceWei,
      startMs,
      endMs,
      nowMs,
    });
    expect(result).toBe(expectedPrice);
  });

  it('should handle zero duration by returning reserve price', () => {
    const result = currentDutchPrice({
      startPriceWei,
      reservePriceWei,
      startMs: 1000,
      endMs: 1000, // Same time
      nowMs: 1000,
    });
    expect(result).toBe(reservePriceWei);
  });

  it('should return correct price at 25% through auction', () => {
    const nowMs = startMs + (endMs - startMs) * 0.25;
    const result = currentDutchPrice({
      startPriceWei,
      reservePriceWei,
      startMs,
      endMs,
      nowMs,
    });
    
    // At 25% through, price should be 75% of the way from start to reserve
    const expectedPrice = BigInt('775000000000000000'); // 0.775 ETH
    expect(result).toBe(expectedPrice);
  });

  it('should return correct price at 75% through auction', () => {
    const nowMs = startMs + (endMs - startMs) * 0.75;
    const result = currentDutchPrice({
      startPriceWei,
      reservePriceWei,
      startMs,
      endMs,
      nowMs,
    });
    
    // At 75% through, price should be 25% of the way from start to reserve
    const expectedPrice = BigInt('325000000000000000'); // 0.325 ETH
    expect(result).toBe(expectedPrice);
  });

  it('should use current time when nowMs is not provided', () => {
    const originalDateNow = Date.now;
    const mockNow = (startMs + endMs) / 2;
    Date.now = () => mockNow;

    const result = currentDutchPrice({
      startPriceWei,
      reservePriceWei,
      startMs,
      endMs,
    });

    const expectedPrice = (startPriceWei + reservePriceWei) / BigInt(2);
    expect(result).toBe(expectedPrice);

    Date.now = originalDateNow;
  });
});
