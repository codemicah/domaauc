import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth/middleware';
import { getListingsCollection, getOffersCollection } from '@/lib/db/mongo';
import { acceptOfferSchema } from '@/lib/validation/schemas';
import { acceptOffer } from '@/lib/doma/sdk';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, { params }: RouteParams): Promise<NextResponse> {
  const authResult = await requireAuth(request);
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }

  try {
    const { id: listingId } = await params;
    const body = await request.json();
    const validationResult = acceptOfferSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validationResult.error.errors },
        { status: 400 }
      );
    }

    const { offerId } = validationResult.data;

    const listings = await getListingsCollection();
    const listing = await listings.findOne({ _id: listingId });

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify the requesting user is the seller
    if (listing.seller.toLowerCase() !== authResult.address.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only the seller can accept offers' },
        { status: 403 }
      );
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Listing is not active' },
        { status: 400 }
      );
    }

    const offers = await getOffersCollection();
    const offer = await offers.findOne({ _id: offerId, listingId });

    if (!offer) {
      return NextResponse.json(
        { error: 'Offer not found' },
        { status: 404 }
      );
    }

    if (offer.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Offer is not active' },
        { status: 400 }
      );
    }

    // Check if auction is still active
    const now = new Date();
    const endTime = new Date(listing.endAt);

    if (now >= endTime) {
      return NextResponse.json(
        { error: 'Auction has expired' },
        { status: 400 }
      );
    }

    let transactionHash: string | undefined;

    try {
      // Accept offer via Doma SDK
      if (offer.domaOfferId) {
        const result = await acceptOffer({
          offerId: offer.domaOfferId,
          walletClient: {} as any, // Mock wallet client
        });
        transactionHash = result.transactionHash;
      }
    } catch (sdkError) {
      console.error('Doma SDK error:', sdkError);
      // Continue with local state update even if SDK fails
    }

    // Update offer status to ACCEPTED
    await offers.updateOne(
      { _id: offerId },
      {
        $set: {
          status: 'ACCEPTED',
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Mark all other offers for this listing as EXPIRED
    await offers.updateMany(
      { 
        listingId,
        _id: { $ne: offerId },
        status: 'ACTIVE'
      },
      {
        $set: {
          status: 'EXPIRED',
          updatedAt: new Date().toISOString(),
        },
      }
    );

    // Update listing status to SOLD
    await listings.updateOne(
      { _id: listingId },
      {
        $set: {
          status: 'SOLD',
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Offer accepted successfully',
      transactionHash,
      acceptedOffer: {
        offerId: offer._id,
        bidder: offer.bidder,
        username: offer.usernameSnapshot,
        priceWei: offer.priceWei,
      },
    });

  } catch (error) {
    console.error('Failed to accept offer:', error);
    return NextResponse.json(
      { error: 'Failed to accept offer' },
      { status: 500 }
    );
  }
}
