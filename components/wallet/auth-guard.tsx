'use client';

import { useAccount } from 'wagmi';
import { ConnectButton } from './connect-button';
import Link from 'next/link';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({
  children,
  fallback,
}: AuthGuardProps): React.ReactElement {
  const { isConnected, isConnecting } = useAccount();

  if (isConnecting) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {fallback || (
          <>
            <h1 className="text-2xl font-bold text-white">
              Connect Your Wallet
            </h1>
            <p className="text-gray-400 text-center max-w-md">
              Please connect your wallet to access the DomaAuc platform.
            </p>
            <ConnectButton />
            {/* go to landing page */}
            <Link href="/" className="text-blue-400 hover:underline">
              Back to Landing Page
            </Link>
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
