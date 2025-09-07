'use client';

import { useState, useEffect } from 'react';
import { useAccount, useWalletClient } from 'wagmi';
import { parseEther, formatEther, parseUnits, formatUnits } from 'viem';
import { ListingMeta } from '@/lib/doma/types';
import { currentDutchPrice } from '@/lib/price/dutch';
import {
  createOffer,
  getSupportedCurrencies,
  SupportedCurrency,
} from '@/lib/doma/sdk';

interface OfferFormProps {
  listing: ListingMeta;
  listingCurrency: SupportedCurrency;
  onOfferSubmitted: () => void;
}

export function OfferForm({
  listing,
  listingCurrency,
  onOfferSubmitted,
}: OfferFormProps): React.ReactElement {
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [formData, setFormData] = useState({
    username: '',
    offerAmount: '',
    currency: listingCurrency.contractAddress,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [supportedCurrencies, setSupportedCurrencies] = useState<
    SupportedCurrency[]
  >([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(true);

  const currentPrice = currentDutchPrice({
    startPriceWei: BigInt(listing.startPriceWei),
    reservePriceWei: BigInt(listing.reservePriceWei),
    startMs: new Date(listing.startAt).getTime(),
    endMs: new Date(listing.endAt).getTime(),
  });

  const reservePrice = BigInt(listing.reservePriceWei);
  const isAuctionActive =
    new Date() >= new Date(listing.startAt) &&
    new Date() < new Date(listing.endAt);

  const selectedCurrency = supportedCurrencies.find(
    (c) => c.contractAddress === formData.currency
  );

  // Load supported currencies
  useEffect(() => {
    const loadCurrencies = async () => {
      setLoadingCurrencies(true);
      const result = await getSupportedCurrencies({
        contractAddress: listing.tokenContract,
        chainId: listing.chainId,
      });
      setSupportedCurrencies(
        result.currencies.filter(({ type }) => type !== 'LISTING_ONLY')
      );
      setLoadingCurrencies(false);
    };

    loadCurrencies();
  }, [listing.tokenContract, listing.chainId]);

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
      const offerAmountWei = selectedCurrency
        ? parseUnits(formData.offerAmount, selectedCurrency.decimals)
        : parseEther(formData.offerAmount);

      // Only check reserve price if offering in ETH (for now)
      if (
        formData.currency === '0x0000000000000000000000000000000000000000' &&
        offerAmountWei < reservePrice
      ) {
        throw new Error(
          `Offer must be at least ${formatEther(reservePrice)} ETH (reserve price)`
        );
      }

      // First, create the offer in our database
      const dbResponse = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listingId: listing._id,
          bidder: address,
          username: formData.username,
          priceWei: offerAmountWei.toString(),
          price: {
            amount: parseFloat(formatUnits(offerAmountWei, 6)),
            currency: selectedCurrency?.name,
          },
          currency: selectedCurrency?.contractAddress,
          currencySymbol: selectedCurrency?.symbol,
        }),
      });

      if (!dbResponse.ok) {
        const errorData = await dbResponse.json();
        throw new Error(errorData.error || 'Failed to place offer');
      }

      const dbResult = await dbResponse.json();

      // Then, create the offer on-chain using Doma SDK
      if (walletClient) {
        try {
          setProgress('Creating on-chain offer...');
          const sdkResult = await createOffer({
            contractAddress: listing.tokenContract,
            tokenId: listing.tokenId,
            chainId: listing.chainId,
            price: offerAmountWei.toString(),
            currency: formData.currency,
            walletClient,
            onProgress: (step, progressPercent) => {
              setProgress(`${step} (${progressPercent}%)`);
            },
          });

          // Update the database with the Doma order ID
          await fetch('/api/offers', {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              offerId: dbResult.offerId,
              domaOfferId: sdkResult.orderId,
              transactionHash: sdkResult.transactionHash,
            }),
          });

          setProgress('Offer placed successfully!');
        } catch (sdkError) {
          console.warn(
            'SDK offer creation failed, but database offer was created:',
            sdkError
          );
          setProgress('Offer placed (on-chain integration pending)');
        }
      }

      // Reset form
      setFormData({
        username: '',
        offerAmount: '',
        currency: listingCurrency?.contractAddress,
      });
      setProgress('');
      onOfferSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to place offer');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string): void => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValidForm =
    formData.username.length >= 2 &&
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
          <h3 className="text-lg font-semibold text-white mb-2">
            Auction Not Started
          </h3>
          <p className="text-white/70">
            Auction starts at {startTime.toLocaleString()}
          </p>
        </div>
      );
    }

    if (now >= endTime) {
      return (
        <div className="glass-card text-center">
          <h3 className="text-lg font-semibold text-white mb-2">
            Auction Ended
          </h3>
          <p className="text-white/70">
            This auction ended at {endTime.toLocaleString()}
          </p>
        </div>
      );
    }
  }

  const ETH_DECIMAL_PLACES = 18;
  return (
    <div className="glass-card">
      <h3 className="text-lg font-semibold text-white mb-4">Place Offer</h3>

      <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="text-white/70">Current Dutch Price:</span>
          <span className="text-blue-400 font-semibold">
            {parseFloat(formatUnits(currentPrice, ETH_DECIMAL_PLACES)).toFixed(
              2
            )}{' '}
            {listingCurrency?.symbol}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-white/70">Reserve Price:</span>
          <span className="text-white/90">
            {parseFloat(formatUnits(reservePrice, ETH_DECIMAL_PLACES)).toFixed(
              2
            )}{' '}
            {listingCurrency?.symbol}
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
            Currency
          </label>
          {loadingCurrencies ? (
            <div className="glass-input w-full flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            </div>
          ) : (
            <select
              value={formData.currency}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="glass-input w-full"
              required
            >
              {supportedCurrencies.map((currency) => (
                <option
                  key={currency.contractAddress}
                  value={currency.contractAddress}
                >
                  {currency.symbol} - {currency.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            Offer Amount ({selectedCurrency?.symbol})
          </label>
          <input
            type="number"
            step={selectedCurrency?.decimals === 6 ? '0.01' : '0.001'}
            min={
              formData.currency === '0x0000000000000000000000000000000000000000'
                ? formatEther(reservePrice)
                : '0'
            }
            value={formData.offerAmount}
            onChange={(e) => handleInputChange('offerAmount', e.target.value)}
            className="glass-input w-full"
            placeholder={`Enter amount in ${selectedCurrency?.symbol}`}
            required
          />
          <div className="flex justify-between text-xs text-white/50 mt-1">
            {formData.currency ===
              '0x0000000000000000000000000000000000000000' && (
              <span>
                Minimum:{' '}
                {listingCurrency
                  ? parseFloat(
                      formatUnits(reservePrice, listingCurrency.decimals)
                    ).toFixed(2)
                  : parseFloat(formatEther(reservePrice)).toFixed(2)}{' '}
                {listingCurrency?.symbol}
              </span>
            )}
            {formData.currency ===
              '0x0000000000000000000000000000000000000000' && (
              <button
                type="button"
                onClick={() =>
                  handleInputChange(
                    'offerAmount',
                    listingCurrency
                      ? parseFloat(
                          formatUnits(currentPrice, listingCurrency.decimals)
                        ).toFixed(2)
                      : parseFloat(formatEther(currentPrice)).toFixed(2)
                  )
                }
                className="text-blue-400 hover:text-blue-300 underline"
              >
                Use current price
              </button>
            )}
          </div>
        </div>

        {progress && (
          <div className="text-blue-400 text-sm bg-blue-400/10 border border-blue-400/20 rounded-lg p-3">
            {progress}
          </div>
        )}

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
