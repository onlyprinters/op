import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyTrader from '@/models/DailyTrader';
import User from '@/models/User'; // Required for Mongoose populate to work
import { getCurrentSeasonId, getSeasonDisplayName } from '@/lib/seasonUtils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const seasonIdParam = searchParams.get('seasonId'); // Optional: view specific season
    const limit = limitParam ? parseInt(limitParam, 10) : 100;

    // Get season ID (from param or current season)
    const seasonId = seasonIdParam || getCurrentSeasonId();
    const seasonDisplayName = getSeasonDisplayName(seasonId);

    console.log('Fetching daily traders for season:', seasonId);
    await User.init();
    // Get all daily traders for this season, sorted by realized USD PNL (one day)
    const dailyTraders = await DailyTrader.find({
      seasonId: seasonId,
      isActive: true,
    })
      .populate('userId', 'name avatar wallet walletOriginal')
      .sort({ realizedUsdPnl: -1 }) // Sort by realized USD PNL from one day trading
      .limit(limit)
      .lean();

    console.log(`Found ${dailyTraders.length} daily traders`);

    // Format the response
    const formattedTraders = dailyTraders.map((trader: Record<string, unknown>, index: number) => {
      const user = trader.userId as { name?: string; avatar?: string; wallet?: string; walletOriginal?: string } | null;
      const pnlBreakdown = trader.pnlBreakdown as Record<string, number> | undefined;

      return {
        id: (trader._id as { toString: () => string }).toString(),
        rank: index + 1,
        name: user?.name || 'Unknown',
        avatar: user?.avatar || '/1.png',
        wallet: user?.wallet || String(trader.wallet || ''),
        walletOriginal: user?.walletOriginal || user?.wallet || String(trader.wallet || ''),
        
        // Balance Stats
        availableBalanceSol: Number(trader.availableBalanceSol) || 0,
        
        // Overall Performance
        totalPnl: Number(trader.totalPnl) || 0,
        totalTrades: Number(trader.totalTrades) || 0,
        
        // Trade Counts
        buyCount: Number(trader.buyCount) || 0,
        sellCount: Number(trader.sellCount) || 0,
        
        // PNL Breakdown
        pnlBreakdown: {
          over500Percent: Number(pnlBreakdown?.over500Percent) || 0,
          between200And500Percent: Number(pnlBreakdown?.between200And500Percent) || 0,
          between0And200Percent: Number(pnlBreakdown?.between0And200Percent) || 0,
          between0AndNeg50Percent: Number(pnlBreakdown?.between0AndNeg50Percent) || 0,
          underNeg50Percent: Number(pnlBreakdown?.underNeg50Percent) || 0,
        },
        
        // USD Metrics
        usdBought: Number(trader.usdBought) || 0,
        usdSold: Number(trader.usdSold) || 0,
        
        // SOL Metrics
        solBought: Number(trader.solBought) || 0,
        solSold: Number(trader.solSold) || 0,
        
        // Realized PNL
        realizedSolPnl: Number(trader.realizedSolPnl) || 0,
        realizedSolBought: Number(trader.realizedSolBought) || 0,
        realizedSolSold: Number(trader.realizedSolSold) || 0,
        realizedUsdPnl: Number(trader.realizedUsdPnl) || 0,
        realizedUsdBought: Number(trader.realizedUsdBought) || 0,
        realizedUsdSold: Number(trader.realizedUsdSold) || 0,
        
        tokenBalance: Number(trader.tokenBalance) || 0,
        soldPrint: Boolean(trader.soldPrint) || false,
        joinedAt: trader.joinedAt,
      };
    });

    return NextResponse.json({
      success: true,
      data: {
        traders: formattedTraders,
        count: formattedTraders.length,
        seasonId: seasonId,
        seasonName: seasonDisplayName,
      },
    });
  } catch (error) {
    console.error('Error fetching daily traders:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
