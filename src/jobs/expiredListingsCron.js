// src/jobs/expiredListingsCron.js
import cron from 'node-cron';
import Listing from '../models/Listing.model.js';

/**
 * Hourly cron: expires Listings where expiresAt has passed.
 * Sets status = 'EXPIRED' for PUBLISHED/ACTIVE listings past their expiry.
 *
 * Mirrors the pattern of expiredDealsCron.js.
 * Runs every hour at minute 30 (offset from deal cron to spread DB load).
 */
export function startExpiredListingsCron() {
  cron.schedule('30 * * * *', async () => {
    try {
      const now = new Date();

      const result = await Listing.updateMany(
        {
          isDeleted: false,
          status: { $in: ['PUBLISHED', 'ACTIVE'] },
          expiresAt: { $lt: now, $ne: null },
        },
        {
          $set: { status: 'EXPIRED' },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `[ExpiredListingsCron] ${now.toISOString()} — expired ${result.modifiedCount} listing(s).`
        );
      }
    } catch (err) {
      console.error('[ExpiredListingsCron] Error:', err);
    }
  });

  console.log('[ExpiredListingsCron] Cron job started — checking every hour at :30.');
}
