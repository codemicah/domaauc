'use client';
import Header from '@/components/ui/header';
import { AuthGuard } from '@/components/wallet/auth-guard';
import { ListingMeta } from '@/lib/doma/types';
import { supportedChains } from '@/lib/wagmi/config';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { formatEther } from 'viem';
import { useAccount } from 'wagmi';

export default function ListingsPage(): React.ReactElement {
  const { address } = useAccount();
  const [listings, setListings] = useState<ListingMeta[]>([]);
  const [filteredListings, setFilteredListings] = useState<ListingMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMine, setFilterMine] = useState(false);
  const [selectedChain, setSelectedChain] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'expiring' | 'price-high' | 'price-low'>(
    'expiring'
  );

  useEffect(() => {
    fetchListings();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [listings, searchQuery, filterMine, selectedChain, sortBy, address]);

  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/listings?status=ACTIVE');
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      const data = await response.json();
      setListings(data.listings);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...listings];

    // Search by domain name (token ID)
    if (searchQuery) {
      filtered = filtered.filter((listing) =>
        listing.tokenId.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by mine
    if (filterMine && address) {
      filtered = filtered.filter(
        (listing) => listing.seller.toLowerCase() === address.toLowerCase()
      );
    }

    // Filter by chain
    if (selectedChain !== 'all') {
      filtered = filtered.filter(
        (listing) => listing.chainId === selectedChain
      );
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'expiring':
          return new Date(a.endAt).getTime() - new Date(b.endAt).getTime();
        case 'price-high':
          const priceA =
            a.startPrice?.amount ||
            parseFloat(formatEther(BigInt(a.startPriceWei)));
          const priceB =
            b.startPrice?.amount ||
            parseFloat(formatEther(BigInt(b.startPriceWei)));
          return priceB - priceA;
        case 'price-low':
          const priceLowA =
            a.startPrice?.amount ||
            parseFloat(formatEther(BigInt(a.startPriceWei)));
          const priceLowB =
            b.startPrice?.amount ||
            parseFloat(formatEther(BigInt(b.startPriceWei)));
          return priceLowA - priceLowB;
        default:
          return 0;
      }
    });

    setFilteredListings(filtered);
  };

  const getUniqueChains = () => {
    const chains = [...new Set(listings.map((listing) => listing.chainId))];
    return chains.map((chainId) => ({
      value: chainId,
      label:
        chainId.split(':')[1] === '84532'
          ? 'Base Sepolia'
          : chainId.split(':')[1] === '11155111'
            ? 'Ethereum Sepolia'
            : `Chain ${chainId.split(':')[1]}`,
    }));
  };

  const formatPrice = (listing: ListingMeta) => {
    if (listing.startPrice) {
      return `${listing.startPrice.amount} ${listing.startPrice.currency}`;
    }
    // Fallback to legacy format
    return `${formatEther(BigInt(listing.startPriceWei))} ETH`;
  };

  const getRemainingTime = (endAt: string) => {
    const now = new Date().getTime();
    const end = new Date(endAt).getTime();
    const diff = end - now;

    if (diff <= 0) return 'Expired';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };
  return (
    <AuthGuard>
      <Header />
      <div className="pt-16 sm:pt-24 min-h-screen p-4 sm:p-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
              Browse Auctions
            </h1>
            <p className="text-gray-400 text-sm sm:text-base mb-6">
              Discover active DomaAuc auctions and place your offers
            </p>

            {/* Search and Filters */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 mb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Search Domain
                  </label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by token ID..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Mine Filter */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Filter
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={filterMine}
                      onChange={(e) => setFilterMine(e.target.checked)}
                      className="rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500"
                      disabled={!address}
                    />
                    <span className="text-white/80">My Listings Only</span>
                  </label>
                </div>

                {/* Chain Filter */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Chain
                  </label>
                  <select
                    value={selectedChain}
                    onChange={(e) => setSelectedChain(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Chains</option>
                    {getUniqueChains().map((chain) => (
                      <option key={chain.value} value={chain.value}>
                        {chain.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort */}
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(
                        e.target.value as
                          | 'expiring'
                          | 'price-high'
                          | 'price-low'
                      )
                    }
                    className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="expiring">Expiring Soon</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="price-low">Price: Low to High</option>
                  </select>
                </div>
              </div>

              {/* Results count */}
              <div className="mt-4 text-sm text-white/60">
                Showing {filteredListings.length} of {listings.length} auctions
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <div className="text-red-400 mb-4">{error}</div>
              <button
                onClick={fetchListings}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                Retry
              </button>
            </div>
          ) : filteredListings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {filteredListings.map((listing) => (
                <Link
                  href={`/dashboard/listings/${listing._id}`}
                  key={listing._id}
                >
                  <div
                    key={listing._id}
                    className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 sm:p-6 hover:bg-white/8 transition-all"
                  >
                    <div className="flex flex-col h-full">
                      <div className="mb-4">
                        <h3 className="text-xl font-bold text-white mb-2 truncate">
                          {listing.domain}
                        </h3>
                        <div className="text-xs text-white/50 mb-2">
                          <div className="flex items-center justify-between">
                            <span>Token ID:</span>
                            <div className="flex items-center gap-1">
                              <span
                                className="truncate max-w-[100px]"
                                title={listing.tokenId}
                              >
                                #{listing.tokenId}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(
                                    listing.tokenId
                                  );
                                }}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title="Copy Token ID"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-1">
                            <span>Contract:</span>
                            <div className="flex items-center gap-1">
                              <span
                                className="truncate"
                                title={listing.tokenContract}
                              >
                                {listing.tokenContract.slice(0, 6)}...
                                {listing.tokenContract.slice(-4)}
                              </span>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(
                                    listing.tokenContract
                                  );
                                }}
                                className="p-1 hover:bg-white/10 rounded transition-colors"
                                title="Copy Contract Address"
                              >
                                <svg
                                  className="w-3 h-3"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </div>
                          <div className="mt-1">
                            Chain:{' '}
                            {
                              supportedChains.find(
                                (chain) =>
                                  chain.id ===
                                  Number(listing.chainId.split(':')[1])
                              )?.name
                            }
                          </div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <div className="text-xs text-white/60 mb-1">
                              Current Price
                            </div>
                            <div className="text-sm font-semibold text-blue-400">
                              {formatPrice(listing)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-white/60 mb-1">
                              Reserve
                            </div>
                            <div className="text-sm font-semibold text-white/80">
                              {listing.reservePrice
                                ? `${listing.reservePrice.amount} ${listing.reservePrice.currency}`
                                : `${formatEther(BigInt(listing.reservePriceWei))} ETH`}
                            </div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <div className="text-xs text-white/60 mb-1">
                            Time Remaining
                          </div>
                          <div className="text-sm font-semibold text-orange-400">
                            {getRemainingTime(listing.endAt)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : listings.length > 0 ? (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 text-center max-w-md mx-auto">
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-orange-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No Matching Auctions
              </h3>
              <p className="text-white/60 mb-4 text-sm sm:text-base">
                No auctions match your current filters. Try adjusting your
                search criteria.
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setFilterMine(false);
                  setSelectedChain('all');
                }}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-8 text-center max-w-md mx-auto">
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
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No Active Auctions
              </h3>
              <p className="text-white/60 mb-4 text-sm sm:text-base">
                There are currently no active auctions. Be the first to create
                one!
              </p>
              <a
                href="/dashboard"
                className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-all text-sm"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                Create Auction
              </a>
            </div>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
