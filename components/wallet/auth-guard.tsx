'use client';

import { useEffect, useState } from 'react';
import { ConnectButton } from './connect-button';

interface AuthGuardProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps): React.ReactElement {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const response = await fetch('/api/auth/me');
        setIsAuthenticated(response.ok);
      } catch {
        setIsAuthenticated(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        {fallback || (
          <>
            <h1 className="text-2xl font-bold text-white">Authentication Required</h1>
            <p className="text-gray-400 text-center max-w-md">
              Please connect your wallet and sign in to access the domain auction platform.
            </p>
            <ConnectButton />
          </>
        )}
      </div>
    );
  }

  return <>{children}</>;
}
