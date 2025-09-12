import { NextRequest, NextResponse } from 'next/server';
import { getOffersCollection, getListingsCollection } from '@/lib/db/mongo';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: offerId } = await params;
    const body = await request.json();
    const { listingId, sellerAddress } = body;

    if (!sellerAddress) {
      return NextResponse.json(
        { error: 'Seller address is required' },
        { status: 400 }
      );
    }

    // Get the listing to verify ownership
    const listings = await getListingsCollection();
    const listing = await listings.findOne({ _id: listingId });

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 });
    }

    // Verify the requester is the listing owner
    if (listing.seller.toLowerCase() !== sellerAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only the listing owner can accept offers' },
        { status: 403 }
      );
    }

    // Get the offer
    const offers = await getOffersCollection();
    const offer = await offers.findOne({ _id: offerId });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Verify the offer is for this listing
    if (offer.listingId !== listingId) {
      return NextResponse.json(
        { error: 'Offer does not belong to this listing' },
        { status: 400 }
      );
    }

    // Verify the offer is active
    if (offer.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Offer is not active' },
        { status: 400 }
      );
    }

    // Accept the offer - update offer status
    await offers.updateOne(
      { _id: offerId },
      {
        $set: {
          status: 'ACCEPTED',
          acceptedAt: new Date().toISOString(),
        },
      }
    );

    // Update all other active offers for this listing to REJECTED
    await offers.updateMany(
      {
        listingId,
        _id: { $ne: offerId },
        status: 'ACTIVE',
      },
      {
        $set: {
          status: 'REJECTED',
          rejectedAt: new Date().toISOString(),
        },
      }
    );

    // Update the listing status to SOLD
    await listings.updateOne(
      { _id: listingId },
      {
        $set: {
          status: 'SOLD',
          soldTo: offer.bidder,
          soldPrice: offer.price,
          soldAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Offer accepted successfully',
      offerId,
      listingId,
    });
  } catch (error) {
    console.error('Failed to accept offer:', error);
    return NextResponse.json(
      { error: 'Failed to accept offer' },
      { status: 500 }
    );
  }
}
