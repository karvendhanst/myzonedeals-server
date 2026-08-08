// src/jobs/expiredDealsCron.js
import cron from 'node-cron';
import Deal from '../models/Deal.model.js';

/**
 * Soft-delete deals whose validTill date has passed.
 * Sets isDeleted: true  and  isActive: false.
 *
 * Runs every hour at minute 0  →  cron: '0 * * * *'
 * (change to '* * * * *' for every-minute testing)
 */
export function startExpiredDealsCron() {
  // Runs every hour at :00
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();

      const result = await Deal.updateMany(
        {
          isDeleted: false,
          validTill: { $lt: now },   // validTill is in the past
        },
        {
          $set: { isDeleted: true, isActive: false },
        }
      );

      if (result.modifiedCount > 0) {
        console.log(
          `[ExpiredDealsCron] ${new Date().toISOString()} — soft-deleted ${result.modifiedCount} expired deal(s).`
        );
      }
    } catch (err) {
      console.error('[ExpiredDealsCron] Error while soft-deleting expired deals:', err);
    }
  });

  console.log('[ExpiredDealsCron] Cron job started — checking for expired deals every hour.');
}
