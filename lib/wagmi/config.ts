import { cookieStorage, createConfig, createStorage, http } from 'wagmi';
import { baseSepolia, sepolia, avalancheFuji } from 'wagmi/chains';
import { walletConnect } from 'wagmi/connectors';
import { clientConfig } from '@/lib/config/env';
import { type Chain } from 'viem';

// create chain with wagmi
const domaChain = {
  id: 97476,
  name: 'Doma Testnet',
  rpcUrls: {
    default: { http: ['https://rpc-testnet.doma.xyz'] },
  },
  blockExplorers: {
    default: {
      name: 'Doma Testnet Explorer',
      url: ' https://explorer-testnet.doma.xyz',
    },
  },
  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
  testnet: true,
} as const satisfies Chain;

export const wagmiConfig = createConfig({
  chains: [baseSepolia, sepolia, avalancheFuji, domaChain],
  connectors: [
    walletConnect({
      projectId: clientConfig.NEXT_PUBLIC_WC_PROJECT_ID,
    }),
  ],
  transports: {
    [baseSepolia.id]: http(),
    [sepolia.id]: http(),
    [avalancheFuji.id]: http(),
    [domaChain.id]: http(),
  },
  ssr: true,
  storage: createStorage({
    storage: cookieStorage,
  }),
});

export const supportedChains = [domaChain, avalancheFuji, baseSepolia, sepolia];
