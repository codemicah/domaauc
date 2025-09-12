export type ChainCAIP2 = `eip155:${number}`;

export interface PriceInfo {
  amount: string;
  currency: string;
}

export interface ListingMeta {
  _id: string;
  orderId?: string;
  tokenContract: `0x${string}`;
  tokenId: string;
  chainId: ChainCAIP2;
  seller: `0x${string}`;
  domain?: string;
  startPrice: PriceInfo;
  reservePrice: PriceInfo;
  startPriceWei: string; // bigint string (legacy)
  reservePriceWei: string; // bigint string (legacy)
  startAt: string; // ISO
  endAt: string; // ISO
  status: 'ACTIVE' | 'EXPIRED' | 'SOLD' | 'CANCELLED';
  createdAt: string;
  updatedAt: string;
}

export interface MyListingsResponse extends ListingMeta {
  offers: OfferMeta[];
  totalOffers: number;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface OfferMeta {
  _id: string;
  listingId: string;
  domaOfferId?: string | undefined;
  bidder: `0x${string}`;
  usernameSnapshot?: string | undefined;
  price: PriceInfo;
  priceWei: string; // legacy
  createdAt: string;
  status: 'ACTIVE' | 'CANCELLED' | 'ACCEPTED' | 'EXPIRED' | 'REJECTED';
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
