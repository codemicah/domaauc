import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getListingsCollection } from '@/lib/db/mongo';
import { createListingSchema } from '@/lib/validation/schemas';
import { ListingMeta, ChainCAIP2 } from '@/lib/doma/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const body = await request.json();
    const validationResult = createListingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { tokenContract, tokenId, chainId, startPriceWei, reservePriceWei, startAt, endAt } = validationResult.data;

    // Validate price logic
    if (BigInt(reservePriceWei) > BigInt(startPriceWei)) {
      return NextResponse.json(
        { error: 'Reserve price must be less than or equal to start price' },
        { status: 400 }
      );
    }

    // Validate time logic
    const startTime = new Date(startAt);
    const endTime = new Date(endAt);
    const now = new Date();

    if (startTime <= now) {
      return NextResponse.json(
        { error: 'Start time must be in the future' },
        { status: 400 }
      );
    }

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Minimum duration check (1 hour)
    const minDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    if (endTime.getTime() - startTime.getTime() < minDuration) {
      return NextResponse.json(
        { error: 'Auction duration must be at least 1 hour' },
        { status: 400 }
      );
    }

    const listings = await getListingsCollection();
    
    // Check for existing active listing for this token
    const existingListing = await listings.findOne({
      tokenContract: tokenContract as `0x${string}`,
      tokenId,
      chainId: chainId as ChainCAIP2,
      status: 'ACTIVE',
    });

    if (existingListing) {
      return NextResponse.json(
        { error: 'An active listing already exists for this token' },
        { status: 409 }
      );
    }

    const listingId = crypto.randomUUID();
    const listing: ListingMeta = {
      _id: listingId,
      tokenContract: tokenContract as `0x${string}`,
      tokenId,
      chainId: chainId as ChainCAIP2,
      seller: authResult.address,
      startPriceWei,
      reservePriceWei,
      startAt,
      endAt,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await listings.insertOne(listing);

    return NextResponse.json({ 
      success: true, 
      listingId: listing._id,
      listing 
    });

  } catch (error) {
    console.error('Failed to create listing:', error);
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const seller = searchParams.get('seller');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const listings = await getListingsCollection();
    
    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (seller) filter.seller = seller.toLowerCase();

    const results = await listings
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Math.min(limit, 100))
      .toArray();

    const total = await listings.countDocuments(filter);

    return NextResponse.json({
      listings: results,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    });

  } catch (error) {
    console.error('Failed to fetch listings:', error);
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    );
  }
}
