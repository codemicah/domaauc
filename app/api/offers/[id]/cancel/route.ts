import { NextRequest, NextResponse } from 'next/server';
import { getOffersCollection } from '@/lib/db/mongo';

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
    const { bidderAddress } = body;

    if (!bidderAddress) {
      return NextResponse.json(
        { error: 'Bidder address is required' },
        { status: 400 }
      );
    }

    // Get the offer
    const offers = await getOffersCollection();
    const offer = await offers.findOne({ _id: offerId });

    if (!offer) {
      return NextResponse.json({ error: 'Offer not found' }, { status: 404 });
    }

    // Verify the requester is the offer owner
    if (offer.bidder.toLowerCase() !== bidderAddress.toLowerCase()) {
      return NextResponse.json(
        { error: 'Only the offer owner can cancel their offer' },
        { status: 403 }
      );
    }

    // Verify the offer is active
    if (offer.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Only active offers can be canceled' },
        { status: 400 }
      );
    }

    // Cancel the offer - update offer status
    await offers.updateOne(
      { _id: offerId },
      {
        $set: {
          status: 'CANCELLED',
          canceledAt: new Date().toISOString(),
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: 'Offer canceled successfully',
      offerId,
    });
  } catch (error) {
    console.error('Failed to cancel offer:', error);
    return NextResponse.json(
      { error: 'Failed to cancel offer' },
      { status: 500 }
    );
  }
}
