import { z } from 'zod';

export const chainIdSchema = z.string().regex(/^eip155:\d+$/);
export const addressSchema = z.string().regex(/^0x[0-9a-fA-F]{40}$/);

const priceInfoSchema = z.object({
  amount: z.string(),
  currency: z.enum(['ETH', 'USDC', 'AVAX', 'WETH']),
});

export const createListingSchema = z
  .object({
    domain: z.string().min(1),
    tokenContract: addressSchema,
    tokenId: z.string().min(1),
    chainId: chainIdSchema,
    startPrice: priceInfoSchema,
    reservePrice: priceInfoSchema,
    startPriceWei: z.string().regex(/^\d+$/),
    reservePriceWei: z.string().regex(/^\d+$/),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
  })
  .refine(
    (data) => {
      const durationMs =
        new Date(data.endAt).getTime() - new Date(data.startAt).getTime();
      const durationHours = durationMs / (1000 * 60 * 60);
      return durationHours <= 180;
    },
    {
      message: 'Duration cannot exceed 180 hours',
      path: ['endAt'],
    }
  );

export const placeOfferSchema = z.object({
  listingId: z.string().min(1),
  username: z.string().optional(),
  price: priceInfoSchema,
  priceWei: z.string().regex(/^\d+$/),
});

export const acceptOfferSchema = z.object({
  listingId: z.string().min(1),
  offerId: z.string().min(1),
});

// Client-side environment schema (only NEXT_PUBLIC_ variables)
export const clientEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPPORTED_CHAINS: z.string(),
  NEXT_PUBLIC_WC_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_DOMA_API_URL: z.string().url(),
  NEXT_PUBLIC_DOMA_API_KEY: z.string().min(1),
});

// Server-side environment schema (all variables)
export const serverEnvSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_SUPPORTED_CHAINS: z.string(),
  NEXT_PUBLIC_WC_PROJECT_ID: z.string().min(1),
  NEXT_PUBLIC_DOMA_API_URL: z.string().url(),
  NEXT_PUBLIC_DOMA_API_KEY: z.string().min(1),
  MONGODB_URI: z.string().min(1),
});

// Legacy schema for backward compatibility
export const envSchema = serverEnvSchema;

export type CreateListingInput = z.infer<typeof createListingSchema>;
export type PlaceOfferInput = z.infer<typeof placeOfferSchema>;
export type AcceptOfferInput = z.infer<typeof acceptOfferSchema>;
export type ClientEnvConfig = z.infer<typeof clientEnvSchema>;
export type ServerEnvConfig = z.infer<typeof serverEnvSchema>;
export type EnvConfig = z.infer<typeof envSchema>;
