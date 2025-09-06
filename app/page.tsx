import Link from 'next/link';
import { ConnectButton } from '@/components/wallet/connect-button';

export default function Home(): React.ReactElement {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white/10 backdrop-blur-md border-b border-white/10 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg"></div>
            <h1 className="text-xl font-bold text-white">Domain Auction</h1>
          </div>
          <ConnectButton />
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex items-center justify-center p-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8">
            <h1 className="text-5xl font-bold text-white mb-4">
              Tokenized Domain
              <span className="bg-gradient-to-r from-blue-400 to-purple-600 bg-clip-text text-transparent">
                {' '}Dutch Auctions
              </span>
            </h1>
            <p className="text-xl text-white/70 max-w-2xl mx-auto">
              Create offers-only Dutch auctions for your tokenized domains. 
              Watch prices decline over time until the perfect offer is made.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link
              href="/dashboard"
              className="bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/30 rounded-lg px-6 py-3 text-white transition-all duration-200 hover:shadow-lg text-center"
            >
              Create Auction
            </Link>
            <Link
              href="/listings"
              className="bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-lg px-6 py-3 text-white transition-all duration-200 hover:shadow-lg text-center"
            >
              Browse Auctions
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Dutch Auction Mechanism</h3>
              <p className="text-white/60">Prices decline linearly over time from start to reserve price</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Secure SIWE Authentication</h3>
              <p className="text-white/60">Sign-in with Ethereum for secure wallet-based authentication</p>
            </div>

            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-6 shadow-xl text-center">
              <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">Real-time Leaderboards</h3>
              <p className="text-white/60">Live offer tracking and ranking with auto-refresh</p>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 p-6">
        <div className="max-w-7xl mx-auto text-center text-white/50">
          <p>&copy; 2025 Domain Auction App. Built with Next.js and Doma Protocol.</p>
        </div>
      </footer>
    </div>
  );
}
