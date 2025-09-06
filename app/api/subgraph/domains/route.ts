import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { fetchUserDomains } from '@/lib/doma/subgraph';
import { chainIdSchema } from '@/lib/validation/schemas';
import { ChainCAIP2 } from '@/lib/doma/types';

export async function GET(request: NextRequest): Promise<NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  const chainId = searchParams.get('chainId');

  if (!owner || !chainId) {
    return NextResponse.json(
      { error: 'Owner and chainId parameters are required' },
      { status: 400 }
    );
  }

  // Validate chainId format
  const chainIdValidation = chainIdSchema.safeParse(chainId);
  if (!chainIdValidation.success) {
    return NextResponse.json(
      { error: 'Invalid chainId format' },
      { status: 400 }
    );
  }

  // Ensure the requesting user can only fetch their own domains
  if (owner.toLowerCase() !== authResult.address.toLowerCase()) {
    return NextResponse.json(
      { error: 'Unauthorized: can only fetch your own domains' },
      { status: 403 }
    );
  }

  try {
    const domains = await fetchUserDomains(
      authResult.address,
      chainId as ChainCAIP2
    );

    return NextResponse.json({ domains });
  } catch (error) {
    console.error('Failed to fetch domains:', error);
    return NextResponse.json(
      { error: 'Failed to fetch domains' },
      { status: 500 }
    );
  }
}
