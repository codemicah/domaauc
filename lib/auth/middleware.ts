import { NextRequest, NextResponse } from 'next/server';
import { getSession } from './siwe';

export async function requireAuth(request: NextRequest): Promise<{ address: `0x${string}`; chainId: number } | NextResponse> {
  const session = await getSession();
  
  if (!session) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }
  
  return {
    address: session.address,
    chainId: session.chainId,
  };
}
