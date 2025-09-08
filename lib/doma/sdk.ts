import { WalletClient } from 'viem';
import { clientConfig } from '@/lib/config/env';
import { ChainCAIP2 } from './types';
import { supportedChains } from '../wagmi/config';
import {
  CurrencyToken,
  DomaOrderbookSDK,
  OnProgressCallback,
  OrderbookType,
} from '@doma-protocol/orderbook-sdk';
export interface GetSupportedCurrenciesResponse {
  currencies: CurrencyToken[];
}

export interface MarketplaceFee {
  recipient: string;
  basisPoints: number;
  feeType?: string;
}

export interface GetOrderbookFeeResponse {
  marketplaceFees: MarketplaceFee[];
}
export interface CreateOfferParams {
  contractAddress: string;
  tokenId: string;
  price: string;
  currency: string;
  expiration?: number;
}

export interface CreateOfferResult {
  success: boolean;
  orderId?: string;
  transactionHash?: string;
  error?: string;
}

let domaSDK: {
  client: DomaOrderbookSDK;
  OrderbookType: typeof OrderbookType;
  viemToEthersSigner: any;
};
let sdkInitialized = false;
const DOMA_SOURCE = 'domaauc';

async function initializeDomaSDK() {
  if (sdkInitialized) return domaSDK;

  const sdkModule = await import('@doma-protocol/orderbook-sdk');
  const config = {
    apiClientOptions: {
      baseUrl: clientConfig.NEXT_PUBLIC_DOMA_API_URL,
      defaultHeaders: { 'Api-Key': clientConfig.NEXT_PUBLIC_DOMA_API_KEY },
    },
    source: DOMA_SOURCE,
    chains: supportedChains,
  };
  const client = sdkModule.createDomaOrderbookClient(config);

  domaSDK = {
    client,
    OrderbookType: sdkModule.OrderbookType,
    viemToEthersSigner: sdkModule.viemToEthersSigner,
  };

  sdkInitialized = true;
  return domaSDK;
}

export async function getSupportedCurrencies(params: {
  contractAddress: `0x${string}`;
  chainId: ChainCAIP2;
}) {
  const sdk = await initializeDomaSDK();

  return await sdk.client.getSupportedCurrencies({
    chainId: params.chainId,
    contractAddress: params.contractAddress,
    orderbook: OrderbookType.DOMA,
  });
}

export async function getOrderbookFee(params: {
  contractAddress: `0x${string}`;
  chainId: ChainCAIP2;
}): Promise<GetOrderbookFeeResponse> {
  const sdk = await initializeDomaSDK();

  return await sdk.client.getOrderbookFee({
    orderbook: OrderbookType.DOMA,
    chainId: params.chainId,
    contractAddress: params.contractAddress,
  });
}

// Utility function to convert chainId format
export function chainIdToCAIP2(chainId: number): ChainCAIP2 {
  return `eip155:${chainId}` as ChainCAIP2;
}

export function caip2ToChainId(chainId: ChainCAIP2): number {
  const parts = chainId.split(':');
  return parseInt(parts[1] || '1');
}

// Order creation functions
export async function createOffer(params: {
  contractAddress: string;
  tokenId: string;
  price: string;
  currency: string;
  chainId: ChainCAIP2;
  walletClient: WalletClient;
  onProgress: OnProgressCallback;
}) {
  const sdk = await initializeDomaSDK();

  const signer = sdk.viemToEthersSigner(params.walletClient, params.chainId);

  const result = await sdk.client.createOffer({
    chainId: params.chainId,
    params: {
      source: DOMA_SOURCE,
      orderbook: OrderbookType.DOMA,
      items: [
        {
          contract: params.contractAddress,
          tokenId: params.tokenId,
          price: params.price,
          currencyContractAddress: params.currency,
        },
      ],
    },
    signer,
    onProgress: params.onProgress,
  });

  return result;
}

export async function createListing(params: {
  contractAddress: string;
  tokenId: string;
  price: string;
  currency: string;
  chainId: ChainCAIP2;
  walletClient: WalletClient;
  onProgress: OnProgressCallback;
}) {
  const sdk = await initializeDomaSDK();

  const signer = sdk.viemToEthersSigner(params.walletClient, params.chainId);

  const result = await sdk.client.createListing({
    chainId: params.chainId,
    params: {
      orderbook: OrderbookType.DOMA,
      source: DOMA_SOURCE,
      items: [
        {
          contract: params.contractAddress,
          tokenId: params.tokenId,
          price: params.price,
          currencyContractAddress: params.currency,
        },
      ],
    },
    signer,
    onProgress: params.onProgress || (() => {}),
  });

  return result;
}

// Additional order operations
export async function acceptOffer(params: {
  orderId: string;
  chainId: ChainCAIP2;
  walletClient: WalletClient;
  onProgress: OnProgressCallback;
}): Promise<{ transactionHash: string }> {
  const sdk = await initializeDomaSDK();

  const signer = sdk.viemToEthersSigner(params.walletClient, params.chainId);

  const result = await sdk.client.acceptOffer({
    params: { orderId: params.orderId },
    signer,
    chainId: params.chainId,
    onProgress: params.onProgress,
  });

  return { transactionHash: result.transactionHash };
}

export async function cancelOffer(params: {
  orderId: string;
  chainId: ChainCAIP2;
  walletClient: WalletClient;
  onProgress: OnProgressCallback;
}) {
  const sdk = await initializeDomaSDK();

  const signer = sdk.viemToEthersSigner(params.walletClient, params.chainId);

  const result = await sdk.client.cancelOffer({
    params: { orderId: params.orderId },
    signer,
    chainId: params.chainId,
    onProgress: params.onProgress,
  });

  return result;
}

export async function buyListing(params: {
  orderId: string;
  chainId: ChainCAIP2;
  fulFillerAddress: `0x${string}`;
  walletClient: WalletClient;
  onProgress: OnProgressCallback;
}) {
  const sdk = await initializeDomaSDK();

  const signer = sdk.viemToEthersSigner(params.walletClient, params.chainId);

  const result = await sdk.client.buyListing({
    params: { orderId: params.orderId },
    signer,
    chainId: params.chainId,
    onProgress: params.onProgress,
  });

  return { transactionHash: result.transactionHash };
}
