'use client';

import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { formatDistanceToNow } from 'date-fns';

interface LeaderboardEntry {
  rank: number;
  offerId: string;
  bidder: `0x${string}`;
  username: string;
  priceWei: string;
  createdAt: string;
  isTopOffer: boolean;
}

interface LeaderboardProps {
  listingId: string;
  refreshTrigger?: number;
}

export function Leaderboard({ listingId, refreshTrigger = 0 }: LeaderboardProps): React.ReactElement {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
        setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaderboard();
  }, [listingId, refreshTrigger]);

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
        <div className="text-red-400 text-center py-4">
          {error}
        </div>
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
          {leaderboard.map((entry) => (
            <div
              key={entry.offerId}
              className={`p-4 rounded-lg border transition-colors ${
                entry.isTopOffer
                  ? 'bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border-yellow-500/40'
                  : 'bg-white/5 border-white/10 hover:bg-white/8'
              }`}
            >
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
                        {entry.username}
                      </span>
                      {entry.isTopOffer && (
                        <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          Top Offer
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-white/50">
                      {entry.bidder.slice(0, 6)}...{entry.bidder.slice(-4)}
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div className={`font-bold ${
                    entry.isTopOffer ? 'text-yellow-400' : 'text-white'
                  }`}>
                    {formatEther(BigInt(entry.priceWei))} ETH
                  </div>
                  <div className="text-xs text-white/50">
                    {formatDistanceToNow(new Date(entry.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
