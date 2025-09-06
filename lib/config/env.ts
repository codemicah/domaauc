import { clientEnvSchema, serverEnvSchema, type ClientEnvConfig, type ServerEnvConfig } from '@/lib/validation/schemas';

// Client-side environment config (only NEXT_PUBLIC_ variables)
function getClientEnvConfig(): ClientEnvConfig {
  const env = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPPORTED_CHAINS: process.env.NEXT_PUBLIC_SUPPORTED_CHAINS,
    NEXT_PUBLIC_WC_PROJECT_ID: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
    NEXT_PUBLIC_SIWE_DOMAIN: process.env.NEXT_PUBLIC_SIWE_DOMAIN,
    NEXT_PUBLIC_DOMA_API_URL: process.env.NEXT_PUBLIC_DOMA_API_URL,
    NEXT_PUBLIC_DOMA_API_KEY: process.env.NEXT_PUBLIC_DOMA_API_KEY,
  };

  const result = clientEnvSchema.safeParse(env);
  
  if (!result.success) {
    console.error('Client environment validation failed:', result.error.format());
    throw new Error(`Client environment validation failed: ${JSON.stringify(result.error.errors, null, 2)}`);
  }
  
  return result.data;
}

// Server-side environment config (all variables)
function getServerEnvConfig(): ServerEnvConfig {
  const env = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPPORTED_CHAINS: process.env.NEXT_PUBLIC_SUPPORTED_CHAINS,
    NEXT_PUBLIC_WC_PROJECT_ID: process.env.NEXT_PUBLIC_WC_PROJECT_ID,
    NEXT_PUBLIC_SIWE_DOMAIN: process.env.NEXT_PUBLIC_SIWE_DOMAIN,
    NEXT_PUBLIC_DOMA_API_URL: process.env.NEXT_PUBLIC_DOMA_API_URL,
    NEXT_PUBLIC_DOMA_API_KEY: process.env.NEXT_PUBLIC_DOMA_API_KEY,
    MONGODB_URI: process.env.MONGODB_URI,
    SESSION_SECRET: process.env.SESSION_SECRET,
  };

  const result = serverEnvSchema.safeParse(env);
  
  if (!result.success) {
    console.error('Server environment validation failed:', result.error.format());
    throw new Error(`Server environment validation failed: ${JSON.stringify(result.error.errors, null, 2)}`);
  }
  
  return result.data;
}

// Export client config (safe to use anywhere)
export const clientConfig = getClientEnvConfig();

// Export server config (only use on server-side)
export const getServerConfig = (): ServerEnvConfig => {
  if (typeof window !== 'undefined') {
    throw new Error('Server config cannot be accessed on the client side');
  }
  return getServerEnvConfig();
};

export function getSupportedChains(): string[] {
  return clientConfig.NEXT_PUBLIC_SUPPORTED_CHAINS.split(',').map((chain: string) => chain.trim());
}
