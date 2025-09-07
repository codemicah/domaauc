import { NextRequest, NextResponse } from 'next/server';
import { fetchUserDomains } from '@/lib/doma/subgraph';
import { addressSchema, chainIdSchema } from '@/lib/validation/schemas';
import { ChainCAIP2 } from '@/lib/doma/types';

export async function GET(request: NextRequest): Promise<NextResponse> {

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

  // Validate owner address format
  const ownerValidation = addressSchema.safeParse(owner);
  if (!ownerValidation.success) {
    return NextResponse.json(
      { error: 'Invalid owner address format' },
      { status: 400 }
    );
  }

  try {
    const domains = await fetchUserDomains(
      owner as `0x${string}`,
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
