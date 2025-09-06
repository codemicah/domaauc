import { NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/siwe';

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      address: session.address,
      chainId: session.chainId,
      issuedAt: session.issuedAt,
    });
  } catch (error) {
    console.error('Session check failed:', error);
    return NextResponse.json(
      { error: 'Session check failed' },
      { status: 500 }
    );
  }
}
