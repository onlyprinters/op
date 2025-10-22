import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import DailyTrader from '@/models/DailyTrader';
import User from '@/models/User';
import { getCurrentSeasonId } from '@/lib/seasonUtils';
import { getWalletPortfolio, transformToTraderData } from '@/lib/axiomService';

// Track last recalculation time per wallet
const lastRecalculation = new Map<string, number>();
const RECALC_COOLDOWN = 60000; // 1 minute in milliseconds

export async function POST(request: NextRequest) {
  try {
    const { wallet } = await request.json();

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const walletLower = wallet.toLowerCase();

    // Check cooldown
    const now = Date.now();
    const lastTime = lastRecalculation.get(walletLower);
    
    if (lastTime && (now - lastTime) < RECALC_COOLDOWN) {
      const remainingSeconds = Math.ceil((RECALC_COOLDOWN - (now - lastTime)) / 1000);
      return NextResponse.json(
        { 
          success: false, 
          error: `Please wait ${remainingSeconds} seconds before recalculating again`,
          remainingSeconds 
        },
        { status: 429 }
      );
    }

    await connectDB();
    await User.init();

    const seasonId = getCurrentSeasonId();

    // Find the trader and populate user to get original wallet
    const trader = await DailyTrader.findOne({
      wallet: walletLower,
      seasonId,
      isActive: true,
    }).populate('userId', 'walletOriginal');

    if (!trader) {
      return NextResponse.json(
        { success: false, error: 'Trader not found in current season' },
        { status: 404 }
      );
    }

    // Get original wallet from user (case-sensitive for Axiom API)
    const user = trader.userId as { walletOriginal?: string } | null;
    const originalWallet = user?.walletOriginal || wallet;

    console.log(`🔄 [RECALC] Manual recalculation requested for ${trader.wallet}`);

    // Fetch fresh data from Axiom
    const portfolioData = await getWalletPortfolio(trader.wallet, originalWallet);

    if (!portfolioData) {
      return NextResponse.json(
        { success: false, error: 'Failed to fetch trading data' },
        { status: 500 }
      );
    }

    // Transform and update trader stats
    const updateData = transformToTraderData(portfolioData);
    Object.assign(trader, updateData);
    await trader.save();

    // Update cooldown
    lastRecalculation.set(walletLower, now);

    console.log(`✅ [RECALC] Successfully updated stats for ${trader.wallet}`);
    console.log(`   Realized SOL PNL: ${updateData.realizedSolPnl?.toFixed(4) || '0.0000'} SOL`);
    console.log(`   Total Trades: ${updateData.totalTrades || 0}`);

    return NextResponse.json({
      success: true,
      data: {
        wallet: trader.wallet,
        stats: updateData,
      },
    });
  } catch (error) {
    console.error('❌ [RECALC] Error recalculating stats:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to recalculate stats',
      },
      { status: 500 }
    );
  }
}
