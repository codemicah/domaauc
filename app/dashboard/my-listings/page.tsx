'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { AuthGuard } from '@/components/wallet/auth-guard';
import { formatDistanceToNow } from 'date-fns';
import { ListingMeta, MyListingsResponse } from '@/lib/doma/types';
import { formatUnits } from 'viem';
import Link from 'next/link';

export default function MyListingsPage() {
  const { address } = useAccount();
  const [listings, setListings] = useState<MyListingsResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [editingListing, setEditingListing] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{
    price?: string;
    endAt?: string;
  }>({});
  const [stats, setStats] = useState<{
    totalOffers: MyListingsResponse['totalOffers'];
  }>({ totalOffers: 0 });

  useEffect(() => {
    const fetchData = async () => {
      if (address) {
        try {
          setLoading(true);
          const response = await fetch(`/api/listings?seller=${address}`);
          if (!response.ok) throw new Error('Failed to fetch listings');
          const data = await response.json();
          setListings(data.listings || []);
          setStats({ totalOffers: data.totalOffers });
        } catch (err) {
          setError(
            err instanceof Error ? err.message : 'Failed to fetch listings'
          );
        } finally {
          setLoading(false);
        }
      }
    };
    fetchData();
  }, [address]);

  const fetchMyListings = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/listings?seller=${address}`);
      if (!response.ok) throw new Error('Failed to fetch listings');
      const data = await response.json();
      setListings(data.listings || []);
      setStats({ totalOffers: data.totalOffers });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch listings');
    } finally {
      setLoading(false);
    }
  };

  const handleDelist = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      const response = await fetch(`/api/listings/${listingId}/delist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sellerAddress: address }),
      });

      if (!response.ok) throw new Error('Failed to delist');

      await fetchMyListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delist');
    } finally {
      setActionLoading(null);
    }
  };

  const handleEditSubmit = async (listingId: string) => {
    setActionLoading(listingId);
    try {
      const response = await fetch(`/api/listings/${listingId}/edit`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerAddress: address,
          ...editForm,
        }),
      });

      if (!response.ok) throw new Error('Failed to update listing');

      setEditingListing(null);
      setEditForm({});
      await fetchMyListings();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update listing');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return 'text-green-400 bg-green-500/20';
      case 'SOLD':
        return 'text-blue-400 bg-blue-500/20';
      case 'EXPIRED':
        return 'text-red-400 bg-red-500/20';
      case 'CANCELLED':
        return 'text-gray-400 bg-gray-500/20';
      default:
        return 'text-white/60 bg-white/10';
    }
  };

  const formatPrice = (amount: string, decimals: number = 6) => {
    return parseFloat(formatUnits(BigInt(amount), decimals)).toFixed(2);
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="max-w-7xl mx-auto">
          {/* Page Header */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">
              My Listings
            </h1>
            <p className="text-white/60">Manage your domain auctions</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-600/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white">
                  {listings.length}
                </span>
              </div>
              <p className="text-white/60 text-sm">Total Listings</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-600/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white">
                  {listings.filter((l) => l.status === 'ACTIVE').length}
                </span>
              </div>
              <p className="text-white/60 text-sm">Active Auctions</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-600/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white">
                  {listings.filter((l) => l.status === 'SOLD').length}
                </span>
              </div>
              <p className="text-white/60 text-sm">Sold Domains</p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-600/20 rounded-xl flex items-center justify-center">
                  <svg
                    className="w-6 h-6 text-orange-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
                    />
                  </svg>
                </div>
                <span className="text-2xl font-bold text-white">
                  {stats.totalOffers}
                </span>
              </div>
              <p className="text-white/60 text-sm">Total Offers</p>
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
                onClick={fetchMyListings}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
              >
                Retry
              </button>
            </div>
          ) : listings.length === 0 ? (
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
                    d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">
                No Listings Yet
              </h3>
              <p className="text-white/60 mb-4">
                You haven&apos;t created any auctions yet.
              </p>
              <Link href="/dashboard">
                <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-2 rounded-lg font-medium">
                  Create Your First Auction
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {listings.map((listing) => (
                <div
                  key={listing._id}
                  className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6"
                >
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left: Domain Info */}
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">
                            {listing.domain}
                          </h3>
                          <p className="text-xs text-white/50">
                            Token ID: {listing.tokenId}
                          </p>
                        </div>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(listing.status)}`}
                        >
                          {listing.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <div>
                          <p className="text-white/60 text-xs mb-1">
                            Current Price
                          </p>
                          <p className="text-white font-medium">
                            {formatPrice(listing.startPrice.amount)}{' '}
                            {listing.startPrice.currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs mb-1">
                            Reserve Price
                          </p>
                          <p className="text-white font-medium">
                            {formatPrice(listing.reservePrice.amount)}{' '}
                            {listing.reservePrice.currency}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs mb-1">Offers</p>
                          <p className="text-white font-medium">
                            {listing.offers.length}
                          </p>
                        </div>
                        <div>
                          <p className="text-white/60 text-xs mb-1">Ends</p>
                          <p className="text-white font-medium text-sm">
                            {formatDistanceToNow(new Date(listing.endAt), {
                              addSuffix: true,
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Right: Actions */}
                    <div className="flex flex-col sm:flex-row lg:flex-col gap-2">
                      <Link href={`/dashboard/listings/${listing._id}`}>
                        <button className="w-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all text-sm">
                          View Details
                        </button>
                      </Link>

                      {listing.status === 'ACTIVE' && (
                        <>
                          <button
                            onClick={() => handleDelist(listing._id)}
                            disabled={actionLoading === listing._id}
                            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg font-medium transition-all text-sm disabled:opacity-50"
                          >
                            {actionLoading === listing._id
                              ? 'Processing...'
                              : 'Delist'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
