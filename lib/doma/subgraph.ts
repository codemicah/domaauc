import { clientConfig } from '@/lib/config/env';
import { DomainToken, ChainCAIP2 } from './types';

interface SubgraphResponse {
  data: {
    names: {
      items: Array<{
        name: string;
        tokens: Array<{
          tokenId: string;
          tokenAddress: string;
          networkId: string;
          ownerAddress: string;
        }>;
      }>;
    };
  };
}

const DOMAINS_QUERY = `
  query GetUserDomains($ownedBy: [AddressCAIP10!]!, $take: Int = 50) {
    names(
      ownedBy: $ownedBy
      take: $take
      sortOrder: DESC
    ) {
      items {
        name
        tokens {
          tokenId
          tokenAddress
          networkId
          ownerAddress
        }
      }
    }
  }
`;

export async function fetchUserDomains(
  owner: `0x${string}`,
  chainId: ChainCAIP2
): Promise<DomainToken[]> {
  try {
    const response = await fetch(
      `${clientConfig.NEXT_PUBLIC_DOMA_API_URL}/graphql`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Api-Key': clientConfig.NEXT_PUBLIC_DOMA_API_KEY,
        },
        body: JSON.stringify({
          query: DOMAINS_QUERY,
          variables: {
            ownedBy: [`${chainId}:${owner.toLowerCase()}`],
            take: 50,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.statusText}`);
    }

    const data: SubgraphResponse = await response.json();

    const domains: DomainToken[] = [];

    data.data.names.items.forEach((nameItem) => {
      nameItem.tokens.forEach((token) => {
        // Only include tokens from the requested chain
        if (token.networkId === chainId) {
          domains.push({
            tokenId: token.tokenId,
            tokenContract: token.tokenAddress as `0x${string}`,
            chainId,
            name: nameItem.name,
            image: undefined,
            description: undefined,
          });
        }
      });
    });

    return domains;
  } catch (error) {
    console.error('Failed to fetch user domains:', error);
    throw new Error('Failed to fetch domains from subgraph');
  }
}
