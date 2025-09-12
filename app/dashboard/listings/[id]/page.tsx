'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/wallet/auth-guard';
import { DutchPricePreview } from '@/components/listing/dutch-price-preview';
import { OfferForm } from '@/components/listing/offer-form';
import { Leaderboard } from '@/components/listing/leaderboard';
import { formatTimeRemaining } from '@/lib/utils/time';
import { ListingMeta } from '@/lib/doma/types';
import { supportedChains } from '@/lib/wagmi/config';
import { getSupportedCurrencies, SupportedCurrency } from '@/lib/doma/sdk';
import Header from '@/components/ui/header';

export default function ListingDetailPage(): React.ReactElement {
  const params = useParams();
  const router = useRouter();
  const [listing, setListing] = useState<ListingMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [listingCurrency, setListingCurrency] = useState<SupportedCurrency>();
  const [currencyLoading, setCurrencyLoading] = useState(false);

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
        const foundListing = data.listings.find(
          (l: ListingMeta) => l._id === listingId
        );

        if (!foundListing) {
          throw new Error('Listing not found');
        }

        setListing(foundListing);

        // Fetch currency information for the listing
        try {
          setCurrencyLoading(true);
          const currencyData = await getSupportedCurrencies({
            contractAddress: foundListing.tokenContract,
            chainId: foundListing.chainId,
          });

          // Find the currency that matches the listing's currency
          const currency = foundListing.startPrice?.currency;
          const matchedCurrency =
            currencyData.find(
              (c) => c.name.toLowerCase() === currency.toLowerCase()
            ) || currencyData.find((c) => c.name === 'USDC');

          setListingCurrency(matchedCurrency);
        } catch (currencyErr) {
          console.error('Failed to fetch currency info:', currencyErr);
        } finally {
          setCurrencyLoading(false);
        }
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
    setRefreshTrigger((prev) => prev + 1);
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
            <h1 className="text-2xl font-bold text-white mb-4">
              Listing Not Found
            </h1>
            <p className="text-white/70 mb-4">
              {error || 'The requested listing could not be found.'}
            </p>
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
      <Header />
      <div className="min-h-screen p-4 sm:p-6 mt-20">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
              <button
                onClick={() => router.push('/listings')}
                className="glass-button px-4 py-2 self-start"
              >
                ← Back
              </button>
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold text-white break-words">
                  {listing.domain || `Domain #${listing.tokenId}`}
                </h1>
                <div className="text-white/50 text-xs sm:text-base">
                  <div className="break-all">Token ID: {listing.tokenId}</div>
                  {/* <div className="break-all">
                    Contract: {listing.tokenContract}
                  </div> */}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="glass-card text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-400">
                  {listing.status}
                </div>
                <div className="text-white/60 text-sm">Status</div>
              </div>

              <div className="glass-card text-center">
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {formatTimeRemaining(new Date(listing.endAt))}
                </div>
                <div className="text-white/60 text-sm">Time Remaining</div>
              </div>

              <div className="glass-card text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-400">
                  {
                    supportedChains.find(
                      (chain) =>
                        chain.id == Number(listing.chainId.split(':')[1])
                    )?.name
                  }
                </div>
                <div className="text-white/60 text-sm">Network</div>
              </div>

              <div className="glass-card text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-400 break-all">
                  {listing.seller.slice(0, 6)}...{listing.seller.slice(-4)}
                </div>
                <div className="text-white/60 text-sm">Seller</div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
            {/* Left Column */}
            <div className="space-y-6 min-w-0">
              <DutchPricePreview
                startPrice={BigInt(listing.startPrice.amount)}
                reservePrice={BigInt(listing.reservePrice.amount)}
                startAt={listing.startAt}
                endAt={listing.endAt}
                currency={listingCurrency!}
                currencyLoading={currencyLoading}
              />

              <OfferForm
                listing={listing}
                listingCurrency={listingCurrency!}
                onOfferSubmitted={handleOfferSubmitted}
              />
            </div>

            {/* Right Column */}
            <div className="min-w-0">
              <Leaderboard
                listingId={listing._id}
                listingCurrency={listingCurrency!}
                refreshTrigger={refreshTrigger}
                listingSeller={listing.seller}
              />
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
