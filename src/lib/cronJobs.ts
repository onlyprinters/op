/**
 * Cron jobs for scheduled tasks
 * - Updates trader stats from Axiom API every 10 minutes
 * - Claims creator fees from Pump.fun every 15 minutes
 * - Validates token holdings every 30 minutes (flags traders who sold $PRINT)
 * - Performs prize draws every 2 hours (at even hours)
 * 
 * ⚠️ SECURITY NOTE:
 * Cron jobs call functions DIRECTLY (not via HTTP API endpoints)
 * This is more secure - no need for API authentication for internal scheduled tasks
 */

import cron from 'node-cron';
import dbConnect from './mongodb';
import DailyTrader from '@/models/DailyTrader';
import User from '@/models/User';
import { getCurrentSeasonId } from './seasonUtils';
import { getWalletPortfolio, transformToTraderData } from './axiomService';
import { claimCreatorFees } from './claimFees';
import { performDraw, shouldPerformDraw } from './drawService';
import { hasRequiredTokenBalance } from './tokenService';

let isJobRunning = false;
let isTokenCheckRunning = false;

/**
 * Update all traders stats from Axiom API
 * This function is called DIRECTLY by cron (not via HTTP)
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

    await dbConnect();
    await User.init();

    // Get all traders in current season
    const traders = await DailyTrader.find({ seasonId })
      .populate('userId', 'walletOriginal');

    if (!traders || traders.length === 0) {
      console.log('ℹ️  [CRON] No active traders found for current season');
      return;
    }

    console.log(`📊 [CRON] Found ${traders.length} traders to update`);

    let updated = 0;
    let failed = 0;

    // Update each trader
    for (const trader of traders) {
      try {
        const userId = trader.userId as { walletOriginal?: string };
        if (!userId?.walletOriginal) {
          console.warn(`⚠️  [CRON] Skipping trader ${trader._id} - missing wallet`);
          failed++;
          continue;
        }

        // Fetch data from Axiom
        const portfolioData = await getWalletPortfolio(userId.walletOriginal);
        
        if (!portfolioData) {
          console.warn(`⚠️  [CRON] No data returned for trader ${trader._id}`);
          failed++;
          continue;
        }

        const traderData = transformToTraderData(portfolioData);

        // Update trader stats
        await DailyTrader.findByIdAndUpdate(trader._id, {
          ...traderData,
          lastUpdated: new Date(),
        });

        updated++;
      } catch (error) {
        console.error(`❌ [CRON] Failed to update trader ${trader._id}:`, error);
        failed++;
      }
    }

    console.log(`✅ [CRON] Successfully updated ${updated}/${traders.length} traders`);
    if (failed > 0) {
      console.warn(`⚠️  [CRON] Failed to update ${failed} traders`);
    }

  } catch (error) {
    console.error('❌ [CRON] Error updating trader stats:', error);
  } finally {
    isJobRunning = false;
  }
}

/**
 * Claim creator fees from Pump.fun
 * Called independently every 15 minutes
 * This function is called DIRECTLY by cron (not via HTTP)
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

    const result = await claimCreatorFees(0.000001); // Default priority fee

    if (result.success) {
      console.log(`✅ [CRON] Creator fees claimed successfully!`);
      console.log(`🔗 [CRON] Transaction: https://solscan.io/tx/${result.signature}`);
    } else {
      // Don't treat as error - might just be no fees available
      console.log(`ℹ️  [CRON] Could not claim fees: ${result.error || 'No fees available'}`);
    }
  } catch (error) {
    console.error('❌ [CRON] Error claiming creator fees:', error);
  }
}

/**
 * Validate token holdings for all active traders
 * Runs every 30 minutes to check if traders still hold required $PRINT tokens
 */
async function validateTokenHoldings() {
  if (isTokenCheckRunning) {
    console.log('⏭️  Skipping token validation - previous check still running');
    return;
  }

  try {
    isTokenCheckRunning = true;
    const seasonId = getCurrentSeasonId();
    const requiredBalance = parseInt(process.env.OP_TOKEN_REQUIRED || '100000', 10);
    const tokenMint = process.env.OP_TOKEN_MINT;
    const rpcEndpoint = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

    if (!tokenMint) {
      console.error('❌ [TOKEN-CHECK] OP_TOKEN_MINT not configured');
      return;
    }

    console.log(`🔍 [TOKEN-CHECK] Starting token validation for season: ${seasonId}`);

    await dbConnect();
    await User.init();

    // Get all active traders in current season
    const traders = await DailyTrader.find({ 
      seasonId,
      isActive: true,
    }).populate('userId', 'walletOriginal');

    if (!traders || traders.length === 0) {
      console.log('ℹ️  [TOKEN-CHECK] No active traders found for current season');
      return;
    }

    console.log(`🔍 [TOKEN-CHECK] Checking ${traders.length} traders...`);

    let flagged = 0;
    let stillValid = 0;

    for (const trader of traders) {
      try {
        const userId = trader.userId as { walletOriginal?: string };
        if (!userId?.walletOriginal) {
          console.warn(`⚠️  [TOKEN-CHECK] Skipping trader ${trader._id} - missing wallet`);
          continue;
        }

        // Check current token balance
        const { hasBalance, balance } = await hasRequiredTokenBalance(
          userId.walletOriginal,
          tokenMint,
          requiredBalance,
          rpcEndpoint
        );

        if (!hasBalance && !trader.soldPrint) {
          // Trader sold $PRINT - flag them
          await DailyTrader.findByIdAndUpdate(trader._id, {
            soldPrint: true,
            lastTokenCheck: new Date(),
          });
          
          console.log(`🚫 [TOKEN-CHECK] FLAGGED: ${userId.walletOriginal.substring(0, 8)}... (${balance.toLocaleString()} < ${requiredBalance.toLocaleString()})`);
          flagged++;
        } else if (hasBalance && trader.soldPrint) {
          // Trader bought back $PRINT - unflag them
          await DailyTrader.findByIdAndUpdate(trader._id, {
            soldPrint: false,
            lastTokenCheck: new Date(),
          });
          
          console.log(`✅ [TOKEN-CHECK] RESTORED: ${userId.walletOriginal.substring(0, 8)}... (${balance.toLocaleString()} >= ${requiredBalance.toLocaleString()})`);
          stillValid++;
        } else {
          // Update last check time
          await DailyTrader.findByIdAndUpdate(trader._id, {
            lastTokenCheck: new Date(),
          });
          stillValid++;
        }
      } catch (error) {
        console.error(`❌ [TOKEN-CHECK] Failed to check trader ${trader._id}:`, error);
      }
    }

    console.log(`✅ [TOKEN-CHECK] Completed: ${flagged} flagged, ${stillValid} still valid`);

  } catch (error) {
    console.error('❌ [TOKEN-CHECK] Error validating token holdings:', error);
  } finally {
    isTokenCheckRunning = false;
  }
}

/**
 * Perform prize draw task
 * Runs every 2 hours at even hours (00, 02, 04, etc.)
 */
async function performDrawTask() {
  // Check if draws are enabled
  if (process.env.SHOULD_PERFORM_DRAWS !== 'true') {
    return; // Draws disabled
  }

  // shouldPerformDraw() checks if it's even hour and if draw wasn't already done
  const shouldDraw = await shouldPerformDraw();
  if (!shouldDraw) {
    return; // Not time for a draw or already done
  }

  try {
    console.log('🎲 [CRON] Starting scheduled prize draw...');
    const result = await performDraw();

    if (result.success) {
      console.log(`✅ [CRON] Prize draw ${result.drawId} completed successfully!`);
    } else {
      console.log(`ℹ️  [CRON] Prize draw skipped: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ [CRON] Error performing prize draw:', error);
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

  // Claim creator fees every 15 minutes
  // Cron pattern: '*/15 * * * *' = every 15 minutes
  const claimFeesJob = cron.schedule('*/15 * * * *', () => {
    claimCreatorFeesTask();
  }, {
    timezone: 'UTC'
  });

  const claimEnabled = process.env.SHOULD_CLAIM_FEES === 'true';
  console.log(`✅ Cron job scheduled: Claim creator fees every 15 minutes`);
  console.log(`   Fee claiming is currently: ${claimEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}`);

  // Validate token holdings every 30 minutes
  // Cron pattern: '*/30 * * * *' = every 30 minutes
  const tokenCheckJob = cron.schedule('*/30 * * * *', () => {
    validateTokenHoldings();
  }, {
    timezone: 'UTC'
  });

  console.log(`✅ Cron job scheduled: Validate token holdings every 30 minutes`);

  // Perform prize draw every 2 hours at even hours (00:00, 02:00, 04:00, etc.)
  // Cron pattern: '0 */2 * * *' = every 2 hours at minute 0
  const prizeDrawJob = cron.schedule('0 */2 * * *', () => {
    performDrawTask();
  }, {
    timezone: 'UTC'
  });

  const drawsEnabled = process.env.SHOULD_PERFORM_DRAWS === 'true';
  console.log(`✅ Cron job scheduled: Prize draw every 2 hours at even hours (00:00, 02:00, 04:00, etc.)`);
  console.log(`   Prize draws are currently: ${drawsEnabled ? '🟢 ENABLED' : '🔴 DISABLED'}`);

  // Optional: Run immediately on startup (after 30 seconds delay)
  setTimeout(() => {
    console.log('🚀 Running initial trader stats update...');
    updateAllTradersStats();
  }, 30000); // 30 second delay to let the app fully start

  return {
    updateStatsJob,
    claimFeesJob,
    tokenCheckJob,
    prizeDrawJob,
  };
}

/**
 * Stop all cron jobs
 * Call this during graceful shutdown
 */
export function stopCronJobs(jobs: ReturnType<typeof initializeCronJobs>) {
  console.log('🛑 Stopping cron jobs...');
  jobs.updateStatsJob.stop();
  jobs.claimFeesJob.stop();
  jobs.tokenCheckJob.stop();
  jobs.prizeDrawJob.stop();
  console.log('✅ All cron jobs stopped');
}
