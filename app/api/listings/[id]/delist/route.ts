import { NextRequest, NextResponse } from 'next/server';
import { getListingsCollection } from '@/lib/db/mongo';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteParams
): Promise<NextResponse> {
  try {
    const { id: listingId } = await params;
    const body = await request.json();
    const { sellerAddress } = body;

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
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      );
    }

    // Verify the requester is the listing owner
    if (listing.seller.toLowerCase() !== sellerAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only the listing owner can delist' },
        { status: 403 }
      );
    }

    // Verify the listing is active
    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Only active listings can be delisted' },
        { status: 400 }
      );
    }

    // Update the listing status to CANCELLED
    await listings.updateOne(
      { _id: listingId },
      {
        $set: {
          status: 'CANCELLED',
          cancelledAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Listing delisted successfully',
      listingId,
    });
  } catch (error) {
    console.error('Failed to delist:', error);
    return NextResponse.json(
      { error: 'Failed to delist' },
      { status: 500 }
    );
  }
}
