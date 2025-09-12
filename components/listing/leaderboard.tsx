'use client';

import { useState, useEffect } from 'react';
import { formatEther, formatUnits, parseUnits } from 'viem';
import { formatDistanceToNow } from 'date-fns';
import { SupportedCurrency } from '@/lib/doma/sdk';
import { useAccount } from 'wagmi';

interface LeaderboardEntry {
  rank: number;
  offerId: string;
  bidder: `0x${string}`;
  username: string;
  priceWei: string;
  price: { amount: number; currency: string };
  createdAt: string;
  isTopOffer: boolean;
}

interface LeaderboardProps {
  listingId: string;
  listingCurrency: SupportedCurrency;
  refreshTrigger?: number;
  listingSeller: string;
}

export function Leaderboard({
  listingId,
  listingCurrency,
  refreshTrigger = 0,
  listingSeller,
}: LeaderboardProps): React.ReactElement {
  const { address } = useAccount();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    const fetchLeaderboard = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/listings/${listingId}/leaderboard`);

        if (!response.ok) {
          throw new Error('Failed to fetch leaderboard');
        }

        const data = await response.json();
        setLeaderboard(data.leaderboard || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load leaderboard'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [listingId, refreshTrigger]);

  const handleAcceptOffer = async (offerId: string): Promise<void> => {
    if (!address) return;
    
    setActionLoading(offerId);
    try {
      const response = await fetch(`/api/offers/${offerId}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId,
          sellerAddress: address,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to accept offer');
      }

      // Refresh the leaderboard
      const fetchResponse = await fetch(`/api/listings/${listingId}/leaderboard`);
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept offer');
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelOffer = async (offerId: string): Promise<void> => {
    if (!address) return;
    
    setActionLoading(offerId);
    try {
      const response = await fetch(`/api/offers/${offerId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bidderAddress: address,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to cancel offer');
      }

      // Refresh the leaderboard
      const fetchResponse = await fetch(`/api/listings/${listingId}/leaderboard`);
      if (fetchResponse.ok) {
        const data = await fetchResponse.json();
        setLeaderboard(data.leaderboard || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to cancel offer');
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">Leaderboard</h3>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">Leaderboard</h3>
        <div className="text-red-400 text-center py-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="glass-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
        <span className="text-sm text-white/60">
          {leaderboard.length} offer{leaderboard.length !== 1 ? 's' : ''}
        </span>
      </div>

      {leaderboard.length === 0 ? (
        <div className="text-center py-8 text-white/60">
          No offers yet. Be the first to place an offer!
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => {
            const isListingOwner = address && listingSeller.toLowerCase() === address.toLowerCase();
            const isOfferOwner = address && entry.bidder.toLowerCase() === address.toLowerCase();
            const canAccept = isListingOwner && entry.isTopOffer;
            const canCancel = isOfferOwner;

            return (
              <div
                key={entry.offerId}
                className={`p-4 rounded-lg border transition-colors ${
                  entry.isTopOffer
                    ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/40'
                    : 'bg-white/5 border-white/10 hover:bg-white/8'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                          entry.isTopOffer
                            ? 'bg-yellow-500 text-black'
                            : entry.rank <= 3
                              ? 'bg-blue-500 text-white'
                              : 'bg-white/20 text-white'
                        }`}
                      >
                        {entry.rank}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {entry.bidder.slice(0, 6)}...{entry.bidder.slice(-4)}
                          </span>
                          {entry.isTopOffer && (
                            <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                              Top Offer
                            </span>
                          )}
                          {isOfferOwner && (
                            <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded-full">
                              Your Offer
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div
                        className={`font-bold ${
                          entry.isTopOffer ? 'text-yellow-400' : 'text-white'
                        }`}
                      >
                        {parseFloat(
                          formatUnits(
                            BigInt(String(entry.price.amount)),
                            listingCurrency.decimals
                          )
                        ).toFixed(2)}{' '}
                        {listingCurrency.symbol}
                      </div>
                      <div className="text-xs text-white/50">
                        {formatDistanceToNow(new Date(entry.createdAt), {
                          addSuffix: true,
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  {(canAccept || canCancel) && (
                    <div className="flex gap-2 justify-end">
                      {canAccept && (
                        <button
                          onClick={() => handleAcceptOffer(entry.offerId)}
                          disabled={actionLoading === entry.offerId}
                          className="px-4 py-2 bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          {actionLoading === entry.offerId ? 'Accepting...' : 'Accept Offer'}
                        </button>
                      )}
                      {canCancel && (
                        <button
                          onClick={() => handleCancelOffer(entry.offerId)}
                          disabled={actionLoading === entry.offerId}
                          className="px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium text-sm transition-colors"
                        >
                          {actionLoading === entry.offerId ? 'Canceling...' : 'Cancel Offer'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {error && (
        <div className="mt-4 text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );
}
