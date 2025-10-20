import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import DailyTrader from '@/models/DailyTrader';
import User from '@/models/User'; // Required for Mongoose populate to work
import { getCurrentSeasonId } from '@/lib/seasonUtils';
import { getWalletPortfolio, transformToTraderData } from '@/lib/axiomService';
import { verifyApiAuth } from '@/lib/apiAuth';

/**
 * POST /api/daily-traders/update-stats
 * Update trader stats from Axiom API for current season
 * 
 * ⚠️ PROTECTED ENDPOINT - Requires authentication
 * This endpoint makes external API calls and modifies database
 * 
 * Request body:
 * - walletAddress (optional): Update specific wallet, or all if not provided
 */
export async function POST(request: NextRequest) {
  // Verify authentication
  const authResult = verifyApiAuth(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    await dbConnect();

    const body = await request.json();
    const { walletAddress } = body;
    const currentSeasonId = getCurrentSeasonId();

    console.log(`🔄 Updating stats for season: ${currentSeasonId}`);

    // If wallet address provided, update only that trader
    if (walletAddress) {
      return await updateSingleTrader(walletAddress, currentSeasonId);
    }

    // Otherwise, update all active traders in current season
    return await updateAllTraders(currentSeasonId);

  } catch (error) {
    console.error('Error updating trader stats:', error);
    return NextResponse.json(
      { error: 'Failed to update trader stats' },
      { status: 500 }
    );
  }
}

/**
 * Update stats for a single trader
 */
async function updateSingleTrader(walletAddress: string, seasonId: string) {
  try {
    await User.init();
    
    // Find trader in current season and populate user to get original wallet
    const trader = await DailyTrader.findOne({
      wallet: walletAddress.toLowerCase(),
      seasonId,
      isActive: true,
    }).populate('userId', 'walletOriginal');

    if (!trader) {
      return NextResponse.json(
        { error: 'Trader not found in current season' },
        { status: 404 }
      );
    }

    // Get original wallet from user (case-sensitive)
    const user = trader.userId as { walletOriginal?: string } | null;
    const originalWallet = user?.walletOriginal || walletAddress;

    // Fetch portfolio data from Axiom with original case-sensitive wallet
    console.log(`📊 Fetching Axiom data for wallet: ${originalWallet}`);
    const portfolioData = await getWalletPortfolio(trader.wallet, originalWallet);

    if (!portfolioData) {
      return NextResponse.json(
        { error: 'Failed to fetch portfolio data from Axiom' },
        { status: 500 }
      );
    }

    // Transform and update
    const updateData = transformToTraderData(portfolioData);
    
    Object.assign(trader, updateData);
    await trader.save();

    console.log(`✅ Updated stats for wallet: ${walletAddress}`);

    return NextResponse.json({
      success: true,
      wallet: walletAddress,
      stats: updateData,
    });

  } catch (error) {
    console.error(`Error updating trader ${walletAddress}:`, error);
    return NextResponse.json(
      { error: 'Failed to update trader' },
      { status: 500 }
    );
  }
}

/**
 * Update stats for all active traders in current season
 */
async function updateAllTraders(seasonId: string) {
  try {
    await User.init();
    
    // Get all active traders in current season and populate user for original wallet
    const traders = await DailyTrader.find({
      seasonId,
      isActive: true,
    }).populate('userId', 'walletOriginal');

    console.log(`📊 Found ${traders.length} active traders to update`);

    if (traders.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No active traders to update',
        updated: 0,
      });
    }

    const results = {
      total: traders.length,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Update each trader with rate limiting (200ms delay)
    for (const trader of traders) {
      try {
        // Get original wallet from user (case-sensitive)
        const user = trader.userId as { walletOriginal?: string } | null;
        const originalWallet = user?.walletOriginal || trader.wallet;
        
        console.log(`📊 Fetching data for: ${originalWallet}`);
        const portfolioData = await getWalletPortfolio(trader.wallet, originalWallet);

        if (portfolioData) {
          const updateData = transformToTraderData(portfolioData);
          Object.assign(trader, updateData);
          await trader.save();
          results.updated++;
          console.log(`✅ Updated: ${trader.wallet}`);
        } else {
          results.failed++;
          results.errors.push(`Failed to fetch data for ${trader.wallet}`);
          console.warn(`⚠️ No data for: ${trader.wallet}`);
        }

        // Rate limiting delay (200ms between requests)
        await new Promise(resolve => setTimeout(resolve, 200));

      } catch (error) {
        results.failed++;
        const errorMsg = error instanceof Error ? error.message : 'Unknown error';
        results.errors.push(`Error updating ${trader.wallet}: ${errorMsg}`);
        console.error(`❌ Error updating ${trader.wallet}:`, error);
      }
    }

    console.log(`✅ Update complete: ${results.updated}/${results.total} successful`);

    return NextResponse.json({
      success: true,
      results,
    });

  } catch (error) {
    console.error('Error in updateAllTraders:', error);
    return NextResponse.json(
      { error: 'Failed to update all traders' },
      { status: 500 }
    );
  }
}
