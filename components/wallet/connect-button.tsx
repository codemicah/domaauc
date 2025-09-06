'use client';

import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';
import { SiweMessage } from 'siwe';
import { useState, useEffect } from 'react';
import { useSignMessage } from 'wagmi';

export function ConnectButton(): React.ReactElement {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const { signMessageAsync } = useSignMessage();
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleAuth = async (): Promise<void> => {
    if (!address) return;

    setIsAuthenticating(true);
    try {
      const message = new SiweMessage({
        domain: window.location.host,
        address,
        statement: 'Sign in to Domain Auction App',
        uri: window.location.origin,
        version: '1',
        chainId: 1,
        nonce: crypto.randomUUID(),
      });

      const signature = await signMessageAsync({
        message: message.prepareMessage(),
      });

      const response = await fetch('/api/auth/siwe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message.prepareMessage(),
          signature,
        }),
      });

      if (!response.ok) {
        throw new Error('Authentication failed');
      }

      window.location.reload();
    } catch (error) {
      console.error('Authentication error:', error);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async (): Promise<void> => {
    await fetch('/api/auth/siwe', { method: 'DELETE' });
    disconnect();
    window.location.reload();
  };

  if (!isMounted) {
    return (
      <button
        disabled
        className="bg-blue-600 text-white px-4 py-2 rounded-lg opacity-50"
      >
        Connect Wallet
      </button>
    );
  }

  if (!isConnected) {
    return (
      <button
        onClick={() => open()}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-400">
        {address?.slice(0, 6)}...{address?.slice(-4)}
      </span>
      <button
        onClick={handleAuth}
        disabled={isAuthenticating}
        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        {isAuthenticating ? 'Signing...' : 'Sign In'}
      </button>
      <button
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors"
      >
        Logout
      </button>
    </div>
  );
}
