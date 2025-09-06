import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getOffersCollection, getListingsCollection } from '@/lib/db/mongo';
import { placeOfferSchema } from '@/lib/validation/schemas';
import { OfferMeta } from '@/lib/doma/types';
import { createOffer } from '@/lib/doma/sdk';
import { getWalletClient } from 'wagmi/actions';
import { wagmiConfig } from '@/lib/wagmi/config';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const validationResult = placeOfferSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { listingId, username, priceWei } = validationResult.data;

    // Validate username format
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      return NextResponse.json(
        { error: 'Username can only contain letters, numbers, underscores, and hyphens' },
        { status: 400 }
      );
    }

    const listings = await getListingsCollection();
    const listing = await listings.findOne({ _id: listingId });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Listing is not active' },
        { status: 400 }
      );
    }

    // Check if auction has started
    const now = new Date();
    const startTime = new Date(listing.startAt);
    const endTime = new Date(listing.endAt);

    if (now < startTime) {
      return NextResponse.json(
        { error: 'Auction has not started yet' },
        { status: 400 }
      );
    }

    if (now >= endTime) {
      return NextResponse.json(
        { error: 'Auction has expired' },
        { status: 400 }
      );
    }

    // Validate minimum offer amount (must be at least reserve price)
    if (BigInt(priceWei) < BigInt(listing.reservePriceWei)) {
      return NextResponse.json(
        { error: 'Offer must be at least the reserve price' },
        { status: 400 }
      );
    }

    const offers = await getOffersCollection();
    
    // Check for existing active offer from this bidder for this listing
    const existingOffer = await offers.findOne({
      listingId,
      bidder: authResult.address,
      status: 'ACTIVE',
    });

    if (existingOffer) {
      return NextResponse.json(
        { error: 'You already have an active offer for this listing. Cancel it first to place a new one.' },
        { status: 409 }
      );
    }

    const offerId = crypto.randomUUID();
    let domaOfferId: string | undefined;

    try {
      // Mock SDK integration for development
      // In production, this would use the actual Doma SDK with proper wallet client
      const mockResult = await createOffer({
        tokenContract: listing.tokenContract,
        tokenId: listing.tokenId,
        chainId: parseInt(listing.chainId.split(':')[1] || '1'),
        priceWei,
        walletClient: {} as any, // Mock wallet client
      });
      domaOfferId = mockResult.offerId;
    } catch (sdkError) {
      console.error('Doma SDK error:', sdkError);
      // Continue without SDK integration for now
    }

    const offer: OfferMeta = {
      _id: offerId,
      listingId,
      domaOfferId,
      bidder: authResult.address,
      usernameSnapshot: username,
      priceWei,
      createdAt: new Date().toISOString(),
      status: 'ACTIVE',
    };

    await offers.insertOne(offer);

    return NextResponse.json({ 
      success: true, 
      offerId: offer._id,
      offer 
    });

  } catch (error) {
    console.error('Failed to create offer:', error);
    return NextResponse.json(
      { error: 'Failed to create offer' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const listingId = searchParams.get('listingId');
    const bidder = searchParams.get('bidder');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const offers = await getOffersCollection();
    
    const filter: Record<string, unknown> = {};
    if (listingId) filter.listingId = listingId;
    if (bidder) filter.bidder = bidder.toLowerCase();
    if (status) filter.status = status;

    const results = await offers
      .find(filter)
      .sort({ priceWei: -1, createdAt: -1 }) // Highest price first, then newest
      .skip(offset)
      .limit(Math.min(limit, 100))
      .toArray();

    const total = await offers.countDocuments(filter);

    return NextResponse.json({
      offers: results,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Failed to fetch offers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch offers' },
      { status: 500 }
    );
  }
}
