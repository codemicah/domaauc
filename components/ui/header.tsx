'use client';

import Link from 'next/link';
import { useAccount } from 'wagmi';
import { ConnectButton } from '../wallet/connect-button';

export default function Header() {
  const { isConnected } = useAccount();
  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white/5 backdrop-blur-xl border-b border-white/10 p-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/">
          <div className="flex items-center gap-4">
            {/* DomaAuc Logo */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 via-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-6 h-6 text-white"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2L2 7v10c0 5.55 3.84 9.74 9 11 5.16-1.26 9-5.45 9-11V7l-10-5z" />
                  <path
                    d="M9 12l2 2 4-4"
                    stroke="white"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              {/* <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full animate-ping"></div> */}
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                DomaAuc
              </h1>
              {/* <p className="text-xs text-blue-300/70">
              Tokenized Domain Auctions
            </p> */}
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-4">
          {isConnected && (
            <Link
              href="/dashboard"
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-all duration-200 flex items-center gap-2"
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
                  d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 5a2 2 0 012-2h4a2 2 0 012 2v2H8V5z"
                />
              </svg>
              Dashboard
            </Link>
          )}
          <ConnectButton />
        </div>
      </div>
    </header>
  );
}
