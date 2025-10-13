/**
 * Cron jobs for scheduled tasks
 * - Updates trader stats from Axiom API every 10 minutes
 * - Claims creator fees from Pump.fun after each stats update
 */

import cron from 'node-cron';
import { getCurrentSeasonId } from './seasonUtils';

let isJobRunning = false;

/**
 * Update all traders stats from Axiom API
 * This function calls our internal API endpoint
 */
async function updateAllTradersStats() {
  if (isJobRunning) {
    console.log('⏭️  Skipping update - previous job still running');
    return;
  }

  try {
    isJobRunning = true;
    const seasonId = getCurrentSeasonId();
    console.log(`🔄 [CRON] Starting trader stats update for season: ${seasonId}`);

    // Call our internal API endpoint
    const response = await fetch('http://localhost:3000/api/daily-traders/update-stats', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Empty body = update all traders
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ [CRON] Successfully updated ${result.results?.updated || 0}/${result.results?.total || 0} traders`);
      if (result.results?.failed > 0) {
        console.warn(`⚠️  [CRON] Failed to update ${result.results.failed} traders`);
      }

      // After successful stats update, claim creator fees
      await claimCreatorFeesTask();
    } else {
      console.error(`❌ [CRON] Update failed:`, result.error);
    }

  } catch (error) {
    console.error('❌ [CRON] Error updating trader stats:', error);
  } finally {
    isJobRunning = false;
  }
}

/**
 * Claim creator fees from Pump.fun
 * Called after each trader stats update
 */
async function claimCreatorFeesTask() {
  // Check if auto-claiming is enabled
  const shouldClaim = process.env.SHOULD_CLAIM_FEES === 'true';
  
  if (!shouldClaim) {
    console.log('⏭️  [CRON] Auto-claim fees disabled (SHOULD_CLAIM_FEES=false)');
    return;
  }

  try {
    console.log('🎁 [CRON] Claiming creator fees from Pump.fun...');

    const response = await fetch('http://localhost:3000/api/claim-fees', {
      method: 'GET',
    });

    const result = await response.json();

    if (result.success) {
      console.log(`✅ [CRON] Creator fees claimed successfully!`);
      console.log(`🔗 [CRON] Transaction: ${result.data?.explorerUrl || 'N/A'}`);
    } else {
      // Don't treat as error - might just be no fees available
      console.log(`ℹ️  [CRON] Could not claim fees: ${result.error || 'No fees available'}`);
    }
  } catch (error) {
    console.error('❌ [CRON] Error claiming creator fees:', error);
  }
}

/**
 * Initialize all cron jobs
 * Call this when the server starts
 */
export function initializeCronJobs() {
  console.log('🕐 Initializing cron jobs...');

  // Update trader stats every 10 minutes
  // Cron pattern: '*/10 * * * *' = every 10 minutes
  const updateStatsJob = cron.schedule('*/10 * * * *', () => {
    updateAllTradersStats();
  }, {
    timezone: 'UTC' // Use UTC to match season timing
  });

  console.log('✅ Cron job scheduled: Update trader stats every 10 minutes');

  // Optional: Run immediately on startup (after 30 seconds delay)
  setTimeout(() => {
    console.log('🚀 Running initial trader stats update...');
    updateAllTradersStats();
  }, 30000); // 30 second delay to let the app fully start

  return {
    updateStatsJob,
  };
}

/**
 * Stop all cron jobs
 * Call this during graceful shutdown
 */
export function stopCronJobs(jobs: ReturnType<typeof initializeCronJobs>) {
  console.log('🛑 Stopping cron jobs...');
  jobs.updateStatsJob.stop();
  console.log('✅ All cron jobs stopped');
}
