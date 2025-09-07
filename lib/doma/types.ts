export type ChainCAIP2 = `eip155:${number}`;

export interface PriceInfo {
  amount: number;
  currency: string; // Now supports any currency from getSupportedCurrencies
}

export interface ListingMeta {
  _id: string;
  orderId?: string;              // Doma order id if created via SDK (optional for offers-only Dutch)
  tokenContract: `0x${string}`;
  tokenId: string;
  chainId: ChainCAIP2;
  seller: `0x${string}`;
  domain?: string;               // Domain name for display
  startPrice: PriceInfo;
  reservePrice: PriceInfo;
  startPriceWei: string;         // bigint string (legacy)
  reservePriceWei: string;       // bigint string (legacy)
  startAt: string;               // ISO
  endAt: string;                 // ISO
  status: 'ACTIVE' | 'EXPIRED' | 'SOLD' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface OfferMeta {
  _id: string;
  listingId: string;
  domaOfferId?: string | undefined;
  bidder: `0x${string}`;
  usernameSnapshot: string;
  price: PriceInfo;
  priceWei: string;              // legacy
  createdAt: string;
  status: 'ACTIVE' | 'CANCELLED' | 'ACCEPTED' | 'EXPIRED';
}

export interface UserSession {
  _id: string;
  address: `0x${string}`;
  createdAt: string;
  lastSeenAt: string;
}

export interface DomainToken {
  tokenId: string;
  tokenContract: `0x${string}`;
  chainId: ChainCAIP2;
  name: string;
  image?: string | undefined;
  description?: string | undefined;
}
