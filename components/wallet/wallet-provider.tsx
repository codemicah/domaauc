'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WagmiProvider } from 'wagmi';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { wagmiConfig } from '@/lib/wagmi/config';
import { clientConfig } from '@/lib/config/env';

const queryClient = new QueryClient();

// Create modal
createWeb3Modal({
  wagmiConfig,
  projectId: clientConfig.NEXT_PUBLIC_WC_PROJECT_ID,
  enableAnalytics: false,
  enableOnramp: false,
});

export function WalletProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
