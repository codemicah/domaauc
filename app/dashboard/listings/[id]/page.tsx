'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/wallet/auth-guard';
import { DutchPricePreview } from '@/components/listing/dutch-price-preview';
import { OfferForm } from '@/components/listing/offer-form';
import { Leaderboard } from '@/components/listing/leaderboard';
import { formatTimeRemaining } from '@/lib/utils/time';
import { ListingMeta } from '@/lib/doma/types';

export default function ListingDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<ListingMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const listingId = params.id as string;

  useEffect(() => {
    const fetchListing = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/listings?id=${listingId}`);
        
        if (!response.ok) {
          throw new Error('Listing not found');
        }

        const data = await response.json();
        const foundListing = data.listings.find((l: ListingMeta) => l._id === listingId);
        
        if (!foundListing) {
          throw new Error('Listing not found');
        }

        setListing(foundListing);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing');
      } finally {
        setLoading(false);
      }
    };

    if (listingId) {
      fetchListing();
    }
  }, [listingId]);

  const handleOfferSubmitted = (): void => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !listing) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="glass-card text-center">
            <h1 className="text-2xl font-bold text-white mb-4">Listing Not Found</h1>
            <p className="text-white/70 mb-4">{error || 'The requested listing could not be found.'}</p>
            <button
              onClick={() => router.push('/dashboard')}
              className="glass-button"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/dashboard')}
                className="glass-button px-4 py-2"
              >
                ← Back
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  Domain #{listing.tokenId}
                </h1>
                <p className="text-white/70">
                  Contract: {listing.tokenContract}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {listing.status}
                </div>
                <div className="text-white/60 text-sm">Status</div>
              </div>
              
              <div className="glass-card text-center">
                <div className="text-2xl font-bold text-white">
                  {formatTimeRemaining(new Date(listing.endAt))}
                </div>
                <div className="text-white/60 text-sm">Time Remaining</div>
              </div>
              
              <div className="glass-card text-center">
                <div className="text-2xl font-bold text-green-400">
                  {listing.chainId.split(':')[1] === '84532' ? 'Base Sepolia' : 'Sepolia'}
                </div>
                <div className="text-white/60 text-sm">Network</div>
              </div>
              
              <div className="glass-card text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                </div>
                <div className="text-white/60 text-sm">Seller</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <DutchPricePreview
                startPriceWei={listing.startPriceWei}
                reservePriceWei={listing.reservePriceWei}
                startAt={listing.startAt}
                endAt={listing.endAt}
              />
              
              <OfferForm 
                listing={listing} 
                onOfferSubmitted={handleOfferSubmitted}
              />
            </div>

            {/* Right Column */}
            <div>
              <Leaderboard listingId={listing._id} refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
