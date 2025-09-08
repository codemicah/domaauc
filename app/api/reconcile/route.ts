import { NextResponse } from 'next/server';
import { getListingsCollection, getOffersCollection } from '@/lib/db/mongo';

export async function POST(): Promise<NextResponse> {
  try {
    const now = new Date();
    const listings = await getListingsCollection();
    const offers = await getOffersCollection();

    // Find expired listings that are still marked as ACTIVE
    const expiredListings = await listings
      .find({
        status: 'ACTIVE',
        endAt: { $lt: now.toISOString() },
      })
      .toArray();

    let updatedListings = 0;
    let updatedOffers = 0;

    // Update expired listings to EXPIRED status
    if (expiredListings.length > 0) {
      const expiredListingIds = expiredListings.map((l) => l._id);

      const listingUpdateResult = await listings.updateMany(
        { _id: { $in: expiredListingIds } },
        {
          $set: {
            status: 'EXPIRED',
            updatedAt: now.toISOString(),
          },
        }
      );
      updatedListings = listingUpdateResult.modifiedCount;

      // Also expire all active offers for these expired listings
      const offerUpdateResult = await offers.updateMany(
        {
          listingId: { $in: expiredListingIds },
          status: 'ACTIVE',
        },
        {
          $set: {
            status: 'EXPIRED',
            updatedAt: now.toISOString(),
          },
        }
      );
      updatedOffers = offerUpdateResult.modifiedCount;
    }

    // Find offers that have expired based on their listing's end time
    // This catches any offers that might have been missed in the above update
    const additionalExpiredOffers = await offers
      .aggregate([
        {
          $lookup: {
            from: 'listings',
            localField: 'listingId',
            foreignField: '_id',
            as: 'listing',
          },
        },
        {
          $match: {
            status: 'ACTIVE',
            'listing.endAt': { $lt: now.toISOString() },
          },
        },
      ])
      .toArray();

    if (additionalExpiredOffers.length > 0) {
      const additionalOfferIds = additionalExpiredOffers.map((o) => o._id);

      const additionalOfferUpdateResult = await offers.updateMany(
        { _id: { $in: additionalOfferIds } },
        {
          $set: {
            status: 'EXPIRED',
            updatedAt: now.toISOString(),
          },
        }
      );
      updatedOffers += additionalOfferUpdateResult.modifiedCount;
    }

    return NextResponse.json({
      success: true,
      message: 'Reconciliation completed',
      stats: {
        expiredListings: updatedListings,
        expiredOffers: updatedOffers,
        processedAt: now.toISOString(),
      },
    });
  } catch (error) {
    console.error('Reconciliation failed:', error);
    return NextResponse.json(
      { error: 'Reconciliation failed' },
      { status: 500 }
    );
  }
}

// Optional: Add a GET endpoint to check what would be reconciled without making changes
export async function GET(): Promise<NextResponse> {
  try {
    const now = new Date();
    const listings = await getListingsCollection();
    const offers = await getOffersCollection();

    // Find expired listings that are still marked as ACTIVE
    const expiredListings = await listings
      .find({
        status: 'ACTIVE',
        endAt: { $lt: now.toISOString() },
      })
      .toArray();

    // Find offers that would be expired
    const expiredOffers = await offers
      .aggregate([
        {
          $lookup: {
            from: 'listings',
            localField: 'listingId',
            foreignField: '_id',
            as: 'listing',
          },
        },
        {
          $match: {
            status: 'ACTIVE',
            'listing.endAt': { $lt: now.toISOString() },
          },
        },
      ])
      .toArray();

    return NextResponse.json({
      preview: true,
      message: 'Reconciliation preview',
      stats: {
        expiredListingsCount: expiredListings.length,
        expiredOffersCount: expiredOffers.length,
        checkedAt: now.toISOString(),
      },
      expiredListings: expiredListings.map((l) => ({
        id: l._id,
        tokenContract: l.tokenContract,
        tokenId: l.tokenId,
        endAt: l.endAt,
      })),
      expiredOffers: expiredOffers.map((o) => ({
        id: o._id,
        listingId: o.listingId,
        bidder: o.bidder,
        priceWei: o.priceWei,
      })),
    });
  } catch (error) {
    console.error('Reconciliation preview failed:', error);
    return NextResponse.json(
      { error: 'Reconciliation preview failed' },
      { status: 500 }
    );
  }
}
