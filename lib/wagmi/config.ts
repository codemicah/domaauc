import { createConfig, http } from 'wagmi';
import { baseSepolia, sepolia } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';
import { clientConfig } from '@/lib/config/env';

export const wagmiConfig = createConfig({
  chains: [baseSepolia, sepolia],
  connectors: [
    walletConnect({
      projectId: clientConfig.NEXT_PUBLIC_WC_PROJECT_ID,
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
  },
});

export const supportedChains = [baseSepolia, sepolia] as const;
