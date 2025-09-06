import { NextRequest, NextResponse } from 'next/server';
import { getOffersCollection, getListingsCollection } from '@/lib/db/mongo';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  try {
    const { id: listingId } = await params;

    // Verify listing exists
    const listings = await getListingsCollection();
    const listing = await listings.findOne({ _id: listingId });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    const offers = await getOffersCollection();
    
    // Get all active offers for this listing, sorted by price (highest first)
    const activeOffers = await offers
      .find({ 
        listingId,
        status: 'ACTIVE'
      })
      .sort({ 
        priceWei: -1, // Highest price first
        createdAt: 1   // Earliest first for same price
      })
      .limit(50) // Limit to top 50 offers
      .toArray();

    // Transform offers for leaderboard display
    const leaderboard = activeOffers.map((offer, index) => ({
      rank: index + 1,
      offerId: offer._id,
      bidder: offer.bidder,
      username: offer.usernameSnapshot,
      priceWei: offer.priceWei,
      createdAt: offer.createdAt,
      isTopOffer: index === 0,
    }));

    return NextResponse.json({
      listingId,
      leaderboard,
      totalOffers: activeOffers.length,
      highestOffer: activeOffers[0] || null,
    });

  } catch (error) {
    console.error('Failed to fetch leaderboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leaderboard' },
      { status: 500 }
    );
  }
}
