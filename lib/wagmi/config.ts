import { createConfig, http } from 'wagmi';
import { baseSepolia, sepolia, avalancheFuji } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';
import { clientConfig } from '@/lib/config/env';

export const wagmiConfig = createConfig({
  chains: [baseSepolia, sepolia, avalancheFuji],
  connectors: [
    walletConnect({
      projectId: clientConfig.NEXT_PUBLIC_WC_PROJECT_ID,
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [avalancheFuji.id]: http(),
  },
});

export const supportedChains = [avalancheFuji, baseSepolia, sepolia];
