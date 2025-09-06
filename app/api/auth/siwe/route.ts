import { NextRequest, NextResponse } from 'next/server';
import { SiweMessage } from 'siwe';
import jwt from 'jsonwebtoken';
import { createSession, setSessionCookie, clearSession } from '@/lib/auth/siwe';
import { getServerConfig } from '@/lib/config/env';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { message, signature } = await request.json();

    if (!message || !signature) {
      return NextResponse.json(
        { error: 'Message and signature are required' },
        { status: 400 }
      );
    }

    const serverConfig = getServerConfig();
    const siweMessage = new SiweMessage({
      ...message,
      domain: serverConfig.NEXT_PUBLIC_SIWE_DOMAIN,
    });
    
    // Verify the message domain matches our expected domain
    if (siweMessage.domain !== serverConfig.NEXT_PUBLIC_SIWE_DOMAIN) {
      return NextResponse.json(
        { error: 'Invalid domain' },
        { status: 400 }
      );
    }

    // Verify the signature
    await siweMessage.verify({ signature });

    // Create session
    const token = jwt.sign(
      { address: siweMessage.address },
      serverConfig.SESSION_SECRET,
      { expiresIn: '24h' }
    );

    // Set session cookie
    const response = NextResponse.json({ success: true });
    response.cookies.set('session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('SIWE verification failed:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 401 }
    );
  }
}

export async function DELETE(): Promise<NextResponse> {
  try {
    const response = NextResponse.json({ success: true });
    response.cookies.delete('session');
    return response;
  } catch (error) {
    console.error('Logout failed:', error);
    return NextResponse.json(
      { error: 'Logout failed' },
      { status: 500 }
    );
  }
}
