'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { AuthGuard } from '@/components/wallet/auth-guard';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';

interface Domain {
  id: string;
  name: string;
  tokenId: string;
  contractAddress: string;
  chainId: string;
  expirationDate: string;
  renewalPrice: {
    amount: string;
    currency: string;
  };
  isListed: boolean;
}

export default function MyDomainsPage() {
  const { address } = useAccount();
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [listingDomain, setListingDomain] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (address) {
        try {
          setLoading(true);

          // Fetch domains from multiple chains
          const chainIds = [
            'eip155:1',
            'eip155:5',
            'eip155:11155111',
            'eip155:84532',
          ];
          const allDomains: Domain[] = [];

          for (const chainId of chainIds) {
            const response = await fetch(
              `/api/subgraph/domains?owner=${address}&chainId=${chainId}`
            );
            if (response.ok) {
              const data = await response.json();
              if (data.domains) {
                // Check listings to see which domains are listed
                const listingsResponse = await fetch(
                  `/api/listings?seller=${address}&status=ACTIVE`
                );
                const listingsData = await listingsResponse.json();
                const listedTokenIds = new Set(
                  listingsData.listings?.map((l: any) => l.tokenId) || []
                );

                const domainsWithListStatus = data.domains.map((d: any) => ({
                  id: d.id,
                  name: d.name,
                  tokenId: d.tokenId,
                  contractAddress: d.contractAddress,
                  chainId: chainId,
                  expirationDate: d.expiryDate
                    ? new Date(parseInt(d.expiryDate) * 1000).toISOString()
                    : new Date(
                        Date.now() + 365 * 24 * 60 * 60 * 1000
                      ).toISOString(),
                  renewalPrice: { amount: '10000000', currency: 'USDC' }, // Default renewal price
                  isListed: listedTokenIds.has(d.tokenId),
                }));
                allDomains.push(...domainsWithListStatus);
              }
            }
          }

          setDomains(allDomains);
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch domains'
          );
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [address]);

  const fetchUserDomains = async () => {
    try {
      setLoading(true);

      // Fetch domains from multiple chains
      const chainIds = [
        'eip155:1',
        'eip155:5',
        'eip155:11155111',
        'eip155:84532',
      ];
      const allDomains: Domain[] = [];

      for (const chainId of chainIds) {
        const response = await fetch(
          `/api/subgraph/domains?owner=${address}&chainId=${chainId}`
        );
        if (response.ok) {
          const data = await response.json();
          if (data.domains) {
            // Check listings to see which domains are listed
            const listingsResponse = await fetch(
              `/api/listings?seller=${address}&status=ACTIVE`
            );
            const listingsData = await listingsResponse.json();
            const listedTokenIds = new Set(
              listingsData.listings?.map((l: any) => l.tokenId) || []
            );

            const domainsWithListStatus = data.domains.map((d: any) => ({
              id: d.id,
              name: d.name,
              tokenId: d.tokenId,
              contractAddress: d.contractAddress,
              chainId: chainId,
              expirationDate: d.expiryDate
                ? new Date(parseInt(d.expiryDate) * 1000).toISOString()
                : new Date(
                    Date.now() + 365 * 24 * 60 * 60 * 1000
                  ).toISOString(),
              renewalPrice: { amount: '10000000', currency: 'USDC' }, // Default renewal price
              isListed: listedTokenIds.has(d.tokenId),
            }));
            allDomains.push(...domainsWithListStatus);
          }
        }
      }

      setDomains(allDomains);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch domains');
    } finally {
      setLoading(false);
    }
  };

  const handleListDomain = async (domainId: string) => {
    setListingDomain(domainId);
    window.location.href = `/dashboard?listDomain=${domainId}`;
  };

  const getExpirationStatus = (expirationDate: string) => {
    const daysUntilExpiration = Math.floor(
      (new Date(expirationDate).getTime() - Date.now()) / (24 * 60 * 60 * 1000)
    );

    if (daysUntilExpiration < 30) {
      return {
        text: `Expires in ${daysUntilExpiration} days`,
        color: 'text-red-400',
      };
    } else if (daysUntilExpiration < 90) {
      return {
        text: `Expires in ${daysUntilExpiration} days`,
        color: 'text-yellow-400',
      };
    } else {
      return {
        text: formatDistanceToNow(new Date(expirationDate), {
          addSuffix: true,
        }),
        color: 'text-green-400',
      };
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              My Domains
            </h1>
            <p className="text-white/60">Manage your domain portfolio</p>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">{error}</div>
              <button
                onClick={fetchUserDomains}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : domains.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No Domains Yet
              </h3>
              <p className="text-white/60">
                You don&apos;t own any domains yet.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {domains.map((domain) => {
                const expStatus = getExpirationStatus(domain.expirationDate);
                return (
                  <div
                    key={domain.id}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-all"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1">
                          {domain.name}
                        </h3>
                        {/* <p className="text-xs text-white/50">Token ID: {domain.tokenId}</p> */}
                      </div>
                      {domain.isListed && (
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          Listed
                        </span>
                      )}
                    </div>

                    <div className="space-y-3 mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">
                          Expiration
                        </span>
                        <span
                          className={`text-sm font-medium ${expStatus.color}`}
                        >
                          {expStatus.text}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-white/60 text-sm">
                          Renewal Price
                        </span>
                        <span className="text-white text-sm font-medium">
                          {(
                            parseFloat(domain.renewalPrice.amount) / 1000000
                          ).toFixed(2)}{' '}
                          {domain.renewalPrice.currency}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {!domain.isListed && (
                        <button
                          onClick={() => handleListDomain(domain.id)}
                          disabled={listingDomain === domain.id}
                          className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm disabled:opacity-50"
                        >
                          {listingDomain === domain.id
                            ? 'Redirecting...'
                            : 'List Domain'}
                        </button>
                      )}
                      {domain.isListed && (
                        <Link
                          href={`/dashboard/my-listings`}
                          className="flex-1"
                        >
                          <button className="w-full bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm">
                            View Listing
                          </button>
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
