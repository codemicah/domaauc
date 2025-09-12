import { NextRequest, NextResponse } from 'next/server';
import { getListingsCollection, getOffersCollection } from '@/lib/db/mongo';
import { createListingSchema, addressSchema } from '@/lib/validation/schemas';
import { ListingMeta, ChainCAIP2 } from '@/lib/doma/types';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();

    // Validate seller address if provided
    if (!body.seller) {
      return NextResponse.json(
        { error: 'Seller address is required' },
        { status: 400 }
      );
    }

    const sellerValidation = addressSchema.safeParse(body.seller);
    if (!sellerValidation.success) {
      return NextResponse.json(
        { error: 'Invalid seller address format' },
        { status: 400 }
      );
    }

    const validationResult = createListingSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const {
      domain,
      tokenContract,
      tokenId,
      chainId,
      startPrice,
      reservePrice,
      startPriceWei,
      reservePriceWei,
      startAt,
      endAt,
    } = validationResult.data;

    // Validate price logic
    if (BigInt(reservePriceWei) > BigInt(startPriceWei)) {
      return NextResponse.json(
        { error: 'Reserve price must be less than or equal to start price' },
        { status: 400 }
      );
    }

    // Validate currency consistency
    if (startPrice.currency !== reservePrice.currency) {
      return NextResponse.json(
        { error: 'Start price and reserve price must use the same currency' },
        { status: 400 }
      );
    }

    // Validate time logic
    let startTime = new Date(startAt);
    const endTime = new Date(endAt);
    const now = new Date();

    if (startTime <= now) startTime = now;

    if (endTime <= startTime) {
      return NextResponse.json(
        { error: 'End time must be after start time' },
        { status: 400 }
      );
    }

    // Duration checks
    const minDuration = 60 * 60 * 1000; // 1 hour in milliseconds
    const maxDuration = 180 * 60 * 60 * 1000; // 180 hours in milliseconds
    const duration = endTime.getTime() - startTime.getTime();

    if (duration < minDuration) {
      return NextResponse.json(
        { error: 'Auction duration must be at least 1 hour' },
        { status: 400 }
      );
    }

    if (duration > maxDuration) {
      return NextResponse.json(
        { error: 'Auction duration cannot exceed 180 hours' },
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
      domain,
      tokenContract: tokenContract as `0x${string}`,
      tokenId,
      chainId: chainId as ChainCAIP2,
      seller: body.seller as `0x${string}`,
      startPrice,
      reservePrice,
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
      listing,
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
    const offers = await getOffersCollection();

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (seller) filter.seller = seller;

    let results = await listings
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(offset)
      .limit(Math.min(limit, 100))
      .toArray();

    let totalOffers = 0;

    // populate offers
    results = await Promise.all(
      results.map(async (listing) => {
        const offersForListing = await offers
          .find({ listingId: listing._id })
          .toArray();
        totalOffers += offersForListing.length;
        return { ...listing, offers: offersForListing };
      })
    );

    const total = await listings.countDocuments(filter);

    return NextResponse.json({
      listings: results,
      totalOffers,
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
