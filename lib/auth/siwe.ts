import { SiweMessage } from 'siwe';
import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';
import { getUserSessionsCollection } from '@/lib/db/mongo';
import { getServerConfig } from '@/lib/config/env';

const getSecret = () => new TextEncoder().encode(getServerConfig().SESSION_SECRET);

export interface SessionData {
  address: `0x${string}`;
  chainId: number;
  issuedAt: string;
  [key: string]: unknown;
}

export async function createSession(address: `0x${string}`, chainId: number): Promise<string> {
  const sessionData: SessionData = {
    address,
    chainId,
    issuedAt: new Date().toISOString(),
  };

  const token = await new SignJWT(sessionData)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h')
    .sign(getSecret());

  // Store session in database
  const userSessions = await getUserSessionsCollection();
  await userSessions.updateOne(
    { address },
    {
      $set: {
        address,
        lastSeenAt: new Date().toISOString(),
      },
      $setOnInsert: {
        _id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      },
    },
    { upsert: true }
  );

  return token;
}

export async function verifySession(token: string): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionData;
  } catch {
    return null;
  }
}

export async function getSession(): Promise<SessionData | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('session')?.value;
  
  if (!token) {
    return null;
  }
  
  return verifySession(token);
}

export async function setSessionCookie(token: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set('session', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60, // 24 hours
    path: '/',
  });
}

export async function clearSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function verifySiweMessage(message: string, signature: string): Promise<SiweMessage> {
  const siweMessage = new SiweMessage(message);
  await siweMessage.verify({ signature });
  return siweMessage;
}
