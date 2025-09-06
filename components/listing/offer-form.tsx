'use client';

import { useState } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseEther, formatEther } from 'viem';
import { ListingMeta } from '@/lib/doma/types';
import { currentDutchPrice } from '@/lib/price/dutch';

interface OfferFormProps {
  listing: ListingMeta;
  onOfferSubmitted: () => void;
}

export function OfferForm({ listing, onOfferSubmitted }: OfferFormProps): React.ReactElement {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [formData, setFormData] = useState({
    username: '',
    offerAmount: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const currentPrice = currentDutchPrice({
    startPriceWei: BigInt(listing.startPriceWei),
    reservePriceWei: BigInt(listing.reservePriceWei),
    startMs: new Date(listing.startAt).getTime(),
    endMs: new Date(listing.endAt).getTime(),
  });

  const reservePrice = BigInt(listing.reservePriceWei);
  const isAuctionActive = new Date() >= new Date(listing.startAt) && new Date() < new Date(listing.endAt);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!address || !walletClient) {
      setError('Please connect your wallet');
      return;
    }

    if (!isAuctionActive) {
      setError('Auction is not currently active');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const offerAmountWei = parseEther(formData.offerAmount);

      if (offerAmountWei < reservePrice) {
        throw new Error(`Offer must be at least ${formatEther(reservePrice)} ETH (reserve price)`);
      }

      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing._id,
          username: formData.username,
          priceWei: offerAmountWei.toString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to place offer');
      }

      // Reset form
      setFormData({ username: '', offerAmount: '' });
      onOfferSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValidForm = formData.username.length >= 2 && 
    formData.username.length <= 32 &&
    /^[a-zA-Z0-9_-]+$/.test(formData.username) &&
    parseFloat(formData.offerAmount || '0') > 0;

  if (!isAuctionActive) {
    const now = new Date();
    const startTime = new Date(listing.startAt);
    const endTime = new Date(listing.endAt);

    if (now < startTime) {
      return (
        <div className="glass-card text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Auction Not Started</h3>
          <p className="text-white/70">
            Auction starts at {startTime.toLocaleString()}
          </p>
        </div>
      );
    }

    if (now >= endTime) {
      return (
        <div className="glass-card text-center">
          <h3 className="text-lg font-semibold text-white mb-2">Auction Ended</h3>
          <p className="text-white/70">
            This auction ended at {endTime.toLocaleString()}
          </p>
        </div>
      );
    }
  }

  return (
    <div className="glass-card">
      <h3 className="text-lg font-semibold text-white mb-4">Place Offer</h3>
      
      <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/70">Current Dutch Price:</span>
          <span className="text-blue-400 font-semibold">
            {formatEther(currentPrice)} ETH
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/70">Reserve Price:</span>
          <span className="text-white/90">
            {formatEther(reservePrice)} ETH
          </span>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Username (displayed on leaderboard)
          </label>
          <input
            type="text"
            value={formData.username}
            onChange={(e) => handleInputChange('username', e.target.value)}
            className="glass-input w-full"
            placeholder="Enter your username"
            minLength={2}
            maxLength={32}
            pattern="[a-zA-Z0-9_-]+"
            title="Username can only contain letters, numbers, underscores, and hyphens"
            required
          />
          <p className="text-xs text-white/50 mt-1">
            2-32 characters, letters, numbers, underscores, and hyphens only
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Offer Amount (ETH)
          </label>
          <input
            type="number"
            step="0.001"
            min={formatEther(reservePrice)}
            value={formData.offerAmount}
            onChange={(e) => handleInputChange('offerAmount', e.target.value)}
            className="glass-input w-full"
            placeholder={`Minimum: ${formatEther(reservePrice)} ETH`}
            required
          />
          <div className="flex justify-between text-xs text-white/50 mt-1">
            <span>Minimum: {formatEther(reservePrice)} ETH</span>
            <button
              type="button"
              onClick={() => handleInputChange('offerAmount', formatEther(currentPrice))}
              className="text-blue-400 hover:text-blue-300 underline"
            >
              Use current price
            </button>
          </div>
        </div>

        {error && (
          <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={!isValidForm || isSubmitting || !address}
          className="glass-button w-full disabled:opacity-50"
        >
          {isSubmitting ? 'Placing Offer...' : 'Place Offer'}
        </button>
      </form>

      {!address && (
        <p className="text-white/60 text-sm text-center mt-4">
          Connect your wallet to place an offer
        </p>
      )}
    </div>
  );
}
