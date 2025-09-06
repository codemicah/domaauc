'use client';

import { useState } from 'react';
import { DomainToken } from '@/lib/doma/types';
import { DomainPicker } from '@/components/ui/domain-picker';
import { DutchPricePreview } from './dutch-price-preview';
import { parseEther, formatEther } from 'viem';
import { useRouter } from 'next/navigation';

export function CreateListingForm(): React.ReactElement {
  const router = useRouter();
  const [selectedDomain, setSelectedDomain] = useState<DomainToken | null>(null);
  const [formData, setFormData] = useState({
    startPrice: '1.0',
    reservePrice: '0.1',
    duration: '24', // hours
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    
    if (!selectedDomain) {
      setError('Please select a domain');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const startAt = new Date(Date.now() + 5 * 60 * 1000); // Start in 5 minutes
      const endAt = new Date(startAt.getTime() + parseInt(formData.duration) * 60 * 60 * 1000);

      const response = await fetch('/api/listings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tokenContract: selectedDomain.tokenContract,
          tokenId: selectedDomain.tokenId,
          chainId: selectedDomain.chainId,
          startPriceWei: parseEther(formData.startPrice).toString(),
          reservePriceWei: parseEther(formData.reservePrice).toString(),
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create listing');
      }

      const result = await response.json();
      router.push(`/dashboard/listings/${result.listingId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create listing');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string): void => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isValidForm = selectedDomain && 
    parseFloat(formData.startPrice) > 0 && 
    parseFloat(formData.reservePrice) > 0 && 
    parseFloat(formData.reservePrice) <= parseFloat(formData.startPrice) &&
    parseInt(formData.duration) >= 1;

  const previewStartAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
  const previewEndAt = new Date(Date.now() + 5 * 60 * 1000 + parseInt(formData.duration || '24') * 60 * 60 * 1000).toISOString();

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Create Dutch Auction</h1>
        <p className="text-white/70">List your tokenized domain for auction with declining price</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Domain Selection */}
          <DomainPicker
            selectedDomain={selectedDomain}
            onDomainSelect={setSelectedDomain}
          />

          {/* Auction Parameters */}
          <div className="glass-card">
            <h3 className="text-lg font-semibold text-white mb-4">Auction Parameters</h3>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Starting Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  value={formData.startPrice}
                  onChange={(e) => handleInputChange('startPrice', e.target.value)}
                  className="glass-input w-full"
                  placeholder="1.0"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Reserve Price (ETH)
                </label>
                <input
                  type="number"
                  step="0.001"
                  min="0"
                  max={formData.startPrice}
                  value={formData.reservePrice}
                  onChange={(e) => handleInputChange('reservePrice', e.target.value)}
                  className="glass-input w-full"
                  placeholder="0.1"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Duration (hours)
                </label>
                <select
                  value={formData.duration}
                  onChange={(e) => handleInputChange('duration', e.target.value)}
                  className="glass-input w-full"
                  required
                >
                  <option value="1">1 hour</option>
                  <option value="6">6 hours</option>
                  <option value="12">12 hours</option>
                  <option value="24">24 hours</option>
                  <option value="48">48 hours</option>
                  <option value="72">72 hours</option>
                  <option value="168">1 week</option>
                </select>
              </div>

              {error && (
                <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-lg p-3">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isValidForm || isSubmitting}
                className="glass-button w-full disabled:opacity-50"
              >
                {isSubmitting ? 'Creating Listing...' : 'Create Auction Listing'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="space-y-6">
          {selectedDomain && (
            <div className="glass-card">
              <h3 className="text-lg font-semibold text-white mb-4">Selected Domain</h3>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-lg bg-white/5 flex items-center justify-center">
                  {selectedDomain.image ? (
                    <img
                      src={selectedDomain.image}
                      alt={selectedDomain.name}
                      className="w-full h-full object-cover rounded-lg"
                    />
                  ) : (
                    <svg className="w-8 h-8 text-white/60" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-white">{selectedDomain.name}</h4>
                  <p className="text-sm text-white/60">Token ID: {selectedDomain.tokenId}</p>
                </div>
              </div>
            </div>
          )}

          {isValidForm && (
            <DutchPricePreview
              startPriceWei={parseEther(formData.startPrice).toString()}
              reservePriceWei={parseEther(formData.reservePrice).toString()}
              startAt={previewStartAt}
              endAt={previewEndAt}
            />
          )}
        </div>
      </div>
    </div>
  );
}
