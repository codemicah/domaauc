'use client';

import { useState, useEffect } from 'react';
import { DomainToken } from '@/lib/doma/types';
import { DomainPicker } from '@/components/ui/domain-picker';
import { DutchPricePreview } from './dutch-price-preview';
import { parseEther, parseUnits } from 'viem';
import { useRouter } from 'next/navigation';
import { useAccount, useWalletClient } from 'wagmi';
import {
  getSupportedCurrencies,
  getOrderbookFee,
  type SupportedCurrency,
  type MarketplaceFee,
} from '@/lib/doma/sdk';
import Image from 'next/image';
import { DomaOrderbookError } from '@doma-protocol/orderbook-sdk';
import { defaultCurrency } from '@/lib/config/env';

export function CreateListingForm(): React.ReactElement {
  const router = useRouter();
  const { address } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [selectedDomain, setSelectedDomain] = useState<DomainToken | null>(
    null
  );
  const [formData, setFormData] = useState({
    startPrice: '1.0',
    reservePrice: '0.1',
    currency: 'USDC',
    duration: '24',
  });
  const [supportedCurrencies, setSupportedCurrencies] = useState<
    SupportedCurrency[]
  >([]);
  const [marketplaceFees, setMarketplaceFees] = useState<MarketplaceFee[]>([]);
  const [loadingCurrencies, setLoadingCurrencies] = useState(false);
  const [loadingFees, setLoadingFees] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] =
    useState<SupportedCurrency>(defaultCurrency);

  // Load supported currencies and fees when domain is selected
  useEffect(() => {
    if (selectedDomain) {
      loadSupportedCurrencies();
      loadMarketplaceFees();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDomain]);

  const loadSupportedCurrencies = async () => {
    if (!selectedDomain) return;

    setLoadingCurrencies(true);
    try {
      const response = await getSupportedCurrencies({
        contractAddress: selectedDomain.tokenContract,
        chainId: selectedDomain.chainId,
      });

      setSupportedCurrencies(response);
      const firstCurrency = response[0];

      if (firstCurrency?.contractAddress) {
        setSelectedCurrency(firstCurrency);
        setFormData((prev) => ({ ...prev, currency: firstCurrency.symbol }));
      }
    } catch (error) {
      console.error('Failed to load supported currencies:', error);
    } finally {
      setLoadingCurrencies(false);
    }
  };

  const loadMarketplaceFees = async () => {
    if (!selectedDomain) return;

    setLoadingFees(true);
    try {
      const response = await getOrderbookFee({
        contractAddress: selectedDomain.tokenContract,
        chainId: selectedDomain.chainId,
      });
      setMarketplaceFees(response.marketplaceFees);
    } catch (error) {
      console.error('Failed to load marketplace fees:', error);
    } finally {
      setLoadingFees(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();

    if (!selectedDomain) {
      setError('Please select a domain');
      return;
    }

    if (!address || !walletClient) {
      setError('Please connect your wallet');
      return;
    }

    if (!selectedCurrency) {
      setError('Please select a currency');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let chainId = selectedDomain.chainId;
    try {
      const startAt = new Date(Date.now());
      const endAt = new Date(
        startAt.getTime() + parseInt(formData.duration) * 60 * 60 * 1000
      );

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenContract: selectedDomain.tokenContract,
          tokenId: selectedDomain.tokenId,
          chainId,
          domain: selectedDomain.name,
          startPrice: {
            amount: parseUnits(
              formData.startPrice,
              selectedCurrency.decimals
            ).toString(),
            currency: formData.currency,
          },
          reservePrice: {
            amount: parseUnits(
              formData.reservePrice,
              selectedCurrency.decimals
            ).toString(),
            currency: formData.currency,
          },
          startPriceWei: parseEther(formData.startPrice).toString(),
          reservePriceWei: parseEther(formData.reservePrice).toString(),
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          seller: address,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing');
      }

      //create listing on doma
      // const listingResult = await createListing({
      //   contractAddress: selectedDomain.tokenContract,
      //   tokenId: selectedDomain.tokenId,
      //   chainId,
      //   price: parseEther(formData.startPrice).toString(), // in wei
      //   currency: selectedCurrency.contractAddress,
      //   walletClient: walletClient,
      //   onProgress: (progress) => {
      //     progress.map((p) => {
      //       console.log(p);
      //     });
      //   },
      // });

      // console.log('Listing created on doma =====>', listingResult);

      const result = await response.json();
      router.push(`/dashboard/listings/${result.listingId}`);
    } catch (err) {
      console.log(err);
      if (err instanceof DomaOrderbookError) {
        console.log(err.details);
        console.log(err.code);
        console.log(err.message);
        console.log(err.context);
      }
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string): void => {
    if (field === 'currency') {
      setSelectedCurrency(supportedCurrencies.find((c) => c.symbol === value)!);
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const isValidForm =
    selectedDomain &&
    parseFloat(formData.startPrice) > 0 &&
    parseFloat(formData.reservePrice) > 0 &&
    parseFloat(formData.reservePrice) <= parseFloat(formData.startPrice) &&
    parseInt(formData.duration) >= 1;

  const previewStartAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const previewEndAt = new Date(
    Date.now() +
      5 * 60 * 1000 +
      parseInt(formData.duration || '24') * 60 * 60 * 1000
  ).toISOString();

  return (
    <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 p-4 sm:p-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
        Create Auction
      </h1>
      <p className="text-white/70 text-sm sm:text-base">
        List your tokenized domain for auction with declining price
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
        {/* Left Column - Form */}
        <div className="space-y-4 sm:space-y-6">
          {/* Domain Selection */}
          <DomainPicker
            selectedDomain={selectedDomain}
            onDomainSelect={setSelectedDomain}
          />

          {/* Auction Parameters */}
          <div className="glass-card">
            <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
              Auction Parameters
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Currency
                </label>
                <select
                  value={formData.currency}
                  onChange={(e) =>
                    handleInputChange('currency', e.target.value)
                  }
                  className="glass-input w-full"
                  required
                  disabled={loadingCurrencies}
                >
                  {loadingCurrencies ? (
                    <option>Loading currencies...</option>
                  ) : supportedCurrencies.length > 0 ? (
                    supportedCurrencies.map((currency) => (
                      <option key={currency.symbol} value={currency.symbol}>
                        {currency.symbol}
                      </option>
                    ))
                  ) : (
                    <>
                      <option value="ETH">ETH - Ethereum</option>
                      <option value="USDC">USDC - USD Coin</option>
                      <option value="AVAX">AVAX - Avalanche</option>
                    </>
                  )}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Starting Price ({formData.currency})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.startPrice}
                    onChange={(e) =>
                      handleInputChange('startPrice', e.target.value)
                    }
                    className="glass-input w-full"
                    placeholder="1.0"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Reserve Price ({formData.currency})
                  </label>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    max={formData.startPrice}
                    value={formData.reservePrice}
                    onChange={(e) =>
                      handleInputChange('reservePrice', e.target.value)
                    }
                    className="glass-input w-full"
                    placeholder="0.1"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Duration (hours)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) =>
                    handleInputChange('duration', e.target.value)
                  }
                  className="glass-input w-full"
                  required
                >
                  <option value="1">1 hour</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="168">7 days</option>
                  <option value="720">1 month</option>
                  <option value="2160">3 months</option>
                  <option value="4320">180 days</option>
                </select>
              </div>

              {/* Fees Breakdown */}
              {selectedDomain && marketplaceFees.length > 0 && (
                <div className="bg-white/5 border border-white/10 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white/80 mb-3">
                    Fees
                  </h4>
                  <div className="space-y-2">
                    {marketplaceFees.map((fee, index) => (
                      <div
                        key={index}
                        className="flex justify-between items-center text-sm"
                      >
                        <span className="text-white/70 capitalize">
                          {fee.feeType || 'Fee'}
                        </span>
                        <span className="text-white">
                          {(fee.basisPoints / 100).toFixed(1)}%
                        </span>
                      </div>
                    ))}
                    <div className="border-t border-white/10 pt-2 mt-2">
                      <div className="flex justify-between items-center text-sm font-medium">
                        <span className="text-white/80">Total Fees</span>
                        <span className="text-white">
                          {(
                            marketplaceFees.reduce(
                              (sum, fee) => sum + fee.basisPoints,
                              0
                            ) / 100
                          ).toFixed(1)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                  {loadingFees && (
                    <div className="text-xs text-white/50 mt-2">
                      Loading fees...
                    </div>
                  )}
                </div>
              )}

              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isValidForm || isSubmitting}
                className="glass-button w-full disabled:opacity-50 text-sm sm:text-base py-3"
              >
                {isSubmitting
                  ? 'Creating Listing...'
                  : 'Create Auction Listing'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-4 sm:space-y-6">
          {selectedDomain && (
            <div className="glass-card">
              <h3 className="text-base sm:text-lg font-semibold text-white mb-4">
                Selected Domain
              </h3>
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-lg bg-white/5 flex items-center justify-center flex-shrink-0">
                  {selectedDomain.image ? (
                    <Image
                      src={selectedDomain.image}
                      alt={selectedDomain.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <svg
                      className="w-6 h-6 sm:w-8 sm:h-8 text-white/60"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-white truncate">
                    {selectedDomain.name}
                  </h4>
                  <p className="text-xs sm:text-sm text-white/60 truncate">
                    Token ID: {selectedDomain.tokenId}
                  </p>
                </div>
              </div>
            </div>
          )}

          {isValidForm && selectedCurrency && (
            <DutchPricePreview
              startPrice={parseUnits(
                formData.startPrice,
                selectedCurrency!.decimals
              )}
              reservePrice={parseUnits(
                formData.reservePrice,
                selectedCurrency!.decimals
              )}
              startAt={previewStartAt}
              endAt={previewEndAt}
              currency={selectedCurrency!}
            />
          )}
        </div>
      </div>
    </div>
  );
}
