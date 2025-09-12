'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { ConnectButton } from '@/components/wallet/connect-button';
import Image from 'next/image';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(to bottom right, #111827, #581c87, #7c3aed)',
      }}
    >
      {/* Desktop Topbar - positioned to the right of sidebar */}
      <div className="fixed top-0 left-72 right-0 z-50 h-16 bg-white/10 backdrop-blur-xl border-b border-white/10 hidden lg:flex items-center justify-end px-4">
        <ConnectButton />
      </div>

      {/* Mobile Topbar - full width */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-white/10 backdrop-blur-xl border-b border-white/10 flex lg:hidden items-center justify-between px-4">
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>

          {/* Logo for mobile */}
          <div className="flex items-center gap-2">
            <Image src="/logo.svg" alt="DomaAuc Logo" width={25} height={25} />
            <span className="text-white font-semibold">DomaAuc</span>
          </div>
        </div>

        {/* Wallet Connection Widget */}
        <div className="ml-auto">
          <ConnectButton />
        </div>
      </div>

      <div className="flex relative">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <main className="flex-1 lg:ml-72 pt-16 min-h-screen relative">
          <div className="p-4 sm:p-6 lg:p-8">{children}</div>
        </main>
      </div>
    </div>
  );
}
