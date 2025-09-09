'use client';

import { useState, useEffect } from 'react';
import { currentDutchPrice } from '@/lib/price/dutch';
import { formatEther, formatUnits } from 'viem';
import { SupportedCurrency } from '@/lib/doma/sdk';

interface DutchPricePreviewProps {
  startPrice: bigint;
  reservePrice: bigint;
  startAt: string;
  endAt: string;
  currency?: SupportedCurrency;
  currencyLoading?: boolean;
  className?: string;
}

export function DutchPricePreview({
  startPrice,
  reservePrice,
  startAt,
  endAt,
  currency,
  className = '',
}: DutchPricePreviewProps): React.ReactElement {
  const [currentPrice, setCurrentPrice] = useState<bigint>(BigInt(0));
  const [timeRemaining, setTimeRemaining] = useState<string>('');

  useEffect(() => {
    const updatePrice = (): void => {
      const now = Date.now();
      const startMs = new Date(startAt).getTime();
      const endMs = new Date(endAt).getTime();

      const price = currentDutchPrice({
        startPrice,
        reservePrice,
        startMs,
        endMs,
        nowMs: now,
      });

      setCurrentPrice(price);

      // Calculate time remaining
      if (now < startMs) {
        const diff = startMs - now;
        setTimeRemaining(`Starts in ${Math.ceil(diff / 1000 / 60)} minutes`);
      } else if (now < endMs) {
        const diff = endMs - now;
        const hours = Math.floor(diff / 1000 / 60 / 60);
        const minutes = Math.floor((diff / 1000 / 60) % 60);
        setTimeRemaining(`${hours}h ${minutes}m remaining`);
      } else {
        setTimeRemaining('Expired');
      }
    };

    updatePrice();
    const interval = setInterval(updatePrice, 1000);

    return () => clearInterval(interval);
  }, [startPrice, reservePrice, startAt, endAt]);

  const generatePricePoints = (): Array<{ time: number; price: number }> => {
    const startMs = new Date(startAt).getTime();
    const endMs = new Date(endAt).getTime();
    const duration = endMs - startMs;
    const points: Array<{ time: number; price: number }> = [];

    for (let i = 0; i <= 100; i += 5) {
      const timeMs = startMs + (duration * i) / 100;
      const price = currentDutchPrice({
        startPrice,
        reservePrice,
        startMs,
        endMs,
        nowMs: timeMs,
      });
      points.push({
        time: i,
        price: Number(formatUnits(price, currency?.decimals ?? 6)),
      });
    }

    return points;
  };

  const pricePoints = generatePricePoints();
  const maxPrice = Math.max(...pricePoints.map((p) => p.price));
  const minPrice = Math.min(...pricePoints.map((p) => p.price));

  return (
    <div className={`glass-card ${className}`}>
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-2">
          Dutch Auction Preview
        </h3>
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold text-blue-400">
            {parseFloat(
              formatUnits(currentPrice, currency?.decimals ?? 6)
            ).toFixed(2)}{' '}
            {currency?.symbol}
          </div>
          <div className="text-sm text-white/70">{timeRemaining}</div>
        </div>
      </div>

      {/* Price Chart */}
      <div className="relative h-32 mb-4">
        <svg className="w-full h-full" viewBox="0 0 400 120">
          {/* Grid lines */}
          <defs>
            <pattern
              id="grid"
              width="40"
              height="24"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 40 0 L 0 0 0 24"
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="1"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* Price line */}
          <path
            d={pricePoints
              .map((point, index) => {
                const x = (point.time / 100) * 400;
                const y =
                  120 -
                  ((point.price - minPrice) / (maxPrice - minPrice)) * 100;
                return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
              })
              .join(' ')}
            fill="none"
            stroke="#60a5fa"
            strokeWidth="2"
          />

          {/* Current price indicator */}
          {(() => {
            const now = Date.now();
            const startMs = new Date(startAt).getTime();
            const endMs = new Date(endAt).getTime();
            const progress = Math.max(
              0,
              Math.min(100, ((now - startMs) / (endMs - startMs)) * 100)
            );
            const x = (progress / 100) * 400;
            const currentPriceNum = Number(
              formatUnits(currentPrice, currency?.decimals ?? 6)
            );
            const y =
              120 -
              ((currentPriceNum - minPrice) / (maxPrice - minPrice)) * 100;

            return (
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
              />
            );
          })()}
        </svg>
      </div>

      {/* Price details */}
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-white/60">Starting Price</div>
          <div className="text-white font-medium">
            {parseFloat(
              formatUnits(startPrice, currency?.decimals ?? 6)
            ).toFixed(2)}{' '}
            {currency?.symbol}
          </div>
        </div>
        <div>
          <div className="text-white/60">Reserve Price</div>
          <div className="text-white font-medium">
            {parseFloat(
              formatUnits(reservePrice, currency?.decimals ?? 6)
            ).toFixed(2)}{' '}
            {currency?.symbol}
          </div>
        </div>
      </div>
    </div>
  );
}
