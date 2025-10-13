import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyTrader from '@/models/DailyTrader';
import { hasRequiredTokenBalance } from '@/lib/tokenService';
import { getCurrentSeasonId } from '@/lib/seasonUtils';
import mongoose from 'mongoose';

const OP_TOKEN_MINT = process.env.OP_TOKEN_MINT;
const OP_TOKEN_REQUIRED = parseInt(process.env.OP_TOKEN_REQUIRED || '1000000', 10);
const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

export async function POST(request: NextRequest) {
  console.log('🔴 POST /api/daily-traders/join - User attempting to join');
  
  try {
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { userId, wallet } = body;
    
    console.log('📝 POST Request:', { userId, wallet });

    // Validate required fields
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!OP_TOKEN_MINT) {
      return NextResponse.json(
        { success: false, error: 'Token mint address not configured' },
        { status: 500 }
      );
    }

    // Check if user exists
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Use the original wallet address (case-sensitive) for Solana operations
    const walletAddressToCheck = user.walletOriginal || wallet;

    // Get current season ID
    const currentSeasonId = getCurrentSeasonId();
    console.log('Current season ID:', currentSeasonId);

    // Check if user already joined current season
    const existingEntry = await DailyTrader.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      seasonId: currentSeasonId,
    });

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: 'You have already joined this season' },
        { status: 409 }
      );
    }

    // Check token balance using original case-sensitive wallet address
    const { hasBalance, balance } = await hasRequiredTokenBalance(
      walletAddressToCheck,
      OP_TOKEN_MINT,
      OP_TOKEN_REQUIRED,
      SOLANA_RPC_ENDPOINT
    );

    if (!hasBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient $OP tokens. Required: ${OP_TOKEN_REQUIRED.toLocaleString()}, Your balance: ${balance.toLocaleString()}`,
          data: {
            required: OP_TOKEN_REQUIRED,
            balance: balance,
          },
        },
        { status: 403 }
      );
    }

    // Add user to DailyTraders
    const dailyTrader = await DailyTrader.create({
      userId: new mongoose.Types.ObjectId(userId),
      wallet: wallet.toLowerCase(),
      seasonId: currentSeasonId,
      tokenBalance: balance,
      realizedPnlUsd: 0,
      realizedPnlSol: 0,
      unrealizedPnlUsd: 0,
      unrealizedPnlSol: 0,
      totalTrades: 0,
      openPositions: 0,
      joinedAt: new Date(),
      isActive: true,
    });

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully joined as a daily trader!',
        data: {
          id: dailyTrader._id,
          userId: dailyTrader.userId,
          wallet: dailyTrader.wallet,
          tokenBalance: dailyTrader.tokenBalance,
          joinedAt: dailyTrader.joinedAt,
        },
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error joining daily traders:', error);

    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      const message = 'message' in error && typeof error.message === 'string' ? error.message : 'Validation error';
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to check if user already joined today
export async function GET(request: NextRequest) {
  console.log('🟢 GET /api/daily-traders/join - Checking join status');
  
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    console.log('📝 GET Request - userId:', userId);

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      );
    }

    // Get current season and check if user joined
    const currentSeasonId = getCurrentSeasonId();

    const entry = await DailyTrader.findOne({
      userId: new mongoose.Types.ObjectId(userId),
      seasonId: currentSeasonId,
    });

    return NextResponse.json({
      success: true,
      data: {
        hasJoinedToday: !!entry,
        currentSeasonId,
        entry: entry ? {
          id: entry._id,
          tokenBalance: entry.tokenBalance,
          availableBalanceSol: entry.availableBalanceSol,
          totalPnl: entry.totalPnl,
          totalTrades: entry.totalTrades,
          buyCount: entry.buyCount,
          sellCount: entry.sellCount,
          realizedUsdPnl: entry.realizedUsdPnl,
          realizedSolPnl: entry.realizedSolPnl,
          realizedUsdBought: entry.realizedUsdBought,
          realizedUsdSold: entry.realizedUsdSold,
          usdBought: entry.usdBought,
          usdSold: entry.usdSold,
          solBought: entry.solBought,
          solSold: entry.solSold,
          pnlBreakdown: entry.pnlBreakdown,
          joinedAt: entry.joinedAt,
        } : null,
      },
    });
  } catch (error) {
    console.error('Error checking daily trader status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
