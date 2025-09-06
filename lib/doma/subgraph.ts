import { clientConfig } from '@/lib/config/env';
import { DomainToken, ChainCAIP2 } from './types';

interface SubgraphResponse {
  data: {
    tokens: Array<{
      id: string;
      tokenId: string;
      contract: {
        id: string;
      };
      name?: string;
      image?: string;
      description?: string;
    }>;
  };
}

const DOMAINS_QUERY = `
  query GetUserDomains($owner: String!, $first: Int = 50) {
    tokens(
      where: { owner: $owner }
      first: $first
      orderBy: tokenId
      orderDirection: asc
    ) {
      id
      tokenId
      contract {
        id
      }
      name
      image
      description
    }
  }
`;

export async function fetchUserDomains(
  owner: `0x${string}`,
  chainId: ChainCAIP2
): Promise<DomainToken[]> {
  try {
    const response = await fetch(clientConfig.NEXT_PUBLIC_DOMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientConfig.NEXT_PUBLIC_DOMA_API_KEY}`,
      },
      body: JSON.stringify({
        query: DOMAINS_QUERY,
        variables: {
          owner: owner.toLowerCase(),
          first: 50,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Subgraph request failed: ${response.statusText}`);
    }

    const data: SubgraphResponse = await response.json();

    return data.data.tokens.map((token) => ({
      tokenId: token.tokenId,
      tokenContract: token.contract.id as `0x${string}`,
      chainId,
      name: token.name || `Domain #${token.tokenId}`,
      image: token.image || undefined,
      description: token.description || undefined,
    }));
  } catch (error) {
    console.error('Failed to fetch user domains:', error);
    throw new Error('Failed to fetch domains from subgraph');
  }
}
