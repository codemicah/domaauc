'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { DomainToken } from '@/lib/doma/types';
import { DomainCard } from './domain-card';
import { supportedChains } from '@/lib/wagmi/config';

interface DomainPickerProps {
  selectedDomain: DomainToken | null;
  onDomainSelect: (domain: DomainToken | null) => void;
}

export function DomainPicker({
  selectedDomain,
  onDomainSelect,
}: DomainPickerProps): React.ReactElement {
  const { address } = useAccount();
  const [domains, setDomains] = useState<DomainToken[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedChainId, setSelectedChainId] =
    useState<string>('eip155:43113'); // AvalancheFuji default

  useEffect(() => {
    if (!address) {
      setDomains([]);
      return;
    }

    const fetchDomains = async (): Promise<void> => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/subgraph/domains?owner=${address}&chainId=${selectedChainId}`
        );

        if (!response.ok) {
          throw new Error('Failed to fetch domains');
        }

        const data = await response.json();
        setDomains(data.domains || []);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to fetch domains'
        );
        setDomains([]);
      } finally {
        setLoading(false);
      }
    };

    fetchDomains();
  }, [address, selectedChainId]);

  const handleChainSelect = (chainId: string): void => {
    setSelectedChainId(chainId);
    onDomainSelect(null); // Clear selection when changing chains
  };

  if (!address) {
    return (
      <div className="glass-card text-center">
        <p className="text-white/70">
          Connect your wallet to view your domains
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Chain Selector */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">
          Select Network
        </h3>
        <div className="flex gap-3">
          {supportedChains.map((chain) => {
            const chainId = `eip155:${chain.id}`;
            return (
              <button
                key={chain.id}
                onClick={() => handleChainSelect(chainId)}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  selectedChainId === chainId
                    ? 'bg-blue-600 text-white'
                    : 'bg-white/10 text-white/70 hover:bg-white/20'
                }`}
              >
                {chain.name}
              </button>
            );
          })}
        </div>
      </div>

      {/* Domain Grid */}
      <div className="glass-card">
        <h3 className="text-lg font-semibold text-white mb-4">Your Domains</h3>

        {loading && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}

        {error && <div className="text-red-400 text-center py-4">{error}</div>}

        {!loading && !error && domains.length === 0 && (
          <div className="text-white/70 text-center py-8">
            No domains found on this network
          </div>
        )}

        {!loading && !error && domains.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {domains.map((domain) => (
              <DomainCard
                key={`${domain.tokenContract}-${domain.tokenId}`}
                domain={domain}
                isSelected={
                  selectedDomain?.tokenContract === domain.tokenContract &&
                  selectedDomain?.tokenId === domain.tokenId
                }
                onSelect={onDomainSelect}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
