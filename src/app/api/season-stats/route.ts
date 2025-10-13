import { NextResponse } from 'next/server';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User'; // Required for Mongoose populate to work
import DailyTrader from '@/models/DailyTrader';
import { getCurrentSeasonId } from '@/lib/seasonUtils';

/**
 * GET /api/season-stats
 * Returns aggregated statistics for the current season (today)
 * - Active Traders: Count of all traders who joined today
 * - Total Volume: Sum of all USD bought + sold by all traders
 * - Total Trades: Sum of all trades (buyCount + sellCount) by all traders
 */
export async function GET() {
  try {
    await dbConnect();
    await User.init();

    const seasonId = getCurrentSeasonId();
    console.log('📊 Fetching season stats for:', seasonId);

    // Get all traders for current season
    const traders = await DailyTrader.find({ seasonId });

    if (!traders || traders.length === 0) {
      console.log('📊 No traders found for current season');
      return NextResponse.json({
        success: true,
        data: {
          activeTraders: 0,
          totalVolumeUsd: 0,
          totalTrades: 0,
          seasonId,
        },
      });
    }

    // Calculate aggregated stats
    const activeTraders = traders.length;
    
    // Total Volume = sum of all USD bought + sold
    const totalVolumeUsd = traders.reduce((sum, trader) => {
      const traderVolume = (trader.usdBought || 0) + (trader.usdSold || 0);
      return sum + traderVolume;
    }, 0);

    // Total Trades = sum of all buy + sell counts
    const totalTrades = traders.reduce((sum, trader) => {
      const traderTrades = (trader.buyCount || 0) + (trader.sellCount || 0);
      return sum + traderTrades;
    }, 0);

    console.log('📊 Season stats calculated:', {
      activeTraders,
      totalVolumeUsd: `$${totalVolumeUsd.toLocaleString()}`,
      totalTrades,
    });

    return NextResponse.json({
      success: true,
      data: {
        activeTraders,
        totalVolumeUsd,
        totalTrades,
        seasonId,
      },
    });
  } catch (error) {
    console.error('❌ Error fetching season stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch season statistics',
      },
      { status: 500 }
    );
  }
}
