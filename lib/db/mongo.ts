import { MongoClient, Db, Collection } from 'mongodb';
import { ListingMeta, OfferMeta, UserSession } from '@/lib/doma/types';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function connectToDatabase(): Promise<Db> {
  if (db) {
    return db;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI environment variable is not set');
  }

  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  
  return db;
}

export async function getListingsCollection(): Promise<Collection<ListingMeta>> {
  const database = await connectToDatabase();
  return database.collection<ListingMeta>('listings');
}

export async function getOffersCollection(): Promise<Collection<OfferMeta>> {
  const database = await connectToDatabase();
  return database.collection<OfferMeta>('offers');
}

export async function getUserSessionsCollection(): Promise<Collection<UserSession>> {
  const database = await connectToDatabase();
  return database.collection<UserSession>('userSessions');
}

export async function closeDatabaseConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
