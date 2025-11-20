import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import DailyTrader from '@/models/DailyTrader';
import { hasRequiredTokenBalance } from '@/lib/tokenService';
import { getCurrentSeasonId } from '@/lib/seasonUtils';
import mongoose from 'mongoose';

const OP_TOKEN_MINT = process.env.OP_TOKEN_MINT;
const OP_TOKEN_REQUIRED = parseInt(process.env.OP_TOKEN_REQUIRED || '100000', 10);
const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';

/**
 * POST /api/daily-traders/join-by-address
 * Join tournament by providing any Solana wallet address (no authentication required)
 * Creates anonymous user if wallet doesn't exist in system
 */
export async function POST(request: NextRequest) {
  console.log('🔴 POST /api/daily-traders/join-by-address - Manual address join');

  try {
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { wallet } = body;

    console.log('📝 POST Request:', { wallet });

    // Validate wallet address
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    // Validate Solana address format
    let publicKey: PublicKey;
    try {
      publicKey = new PublicKey(wallet);
      if (!PublicKey.isOnCurve(publicKey.toBytes())) {
        return NextResponse.json(
          { success: false, error: 'Invalid Solana address format' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid Solana address format' },
        { status: 400 }
      );
    }

    if (!OP_TOKEN_MINT) {
      return NextResponse.json(
        { success: false, error: 'Token mint address not configured' },
        { status: 500 }
      );
    }

    const walletLowercase = wallet.toLowerCase();
    const currentSeasonId = getCurrentSeasonId();

    // Check if user exists, if not create anonymous user
    let user = await User.findOne({ wallet: walletLowercase });

    if (!user) {
      console.log(`📝 Creating anonymous user for wallet: ${wallet}`);
      user = await User.create({
        wallet: walletLowercase,
        walletOriginal: wallet,
        name: `Trader ${wallet.substring(0, 4)}...${wallet.substring(wallet.length - 4)}`,
        avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${wallet}`,
      });
      console.log(`✅ Anonymous user created with ID: ${user._id}`);
    }

    // Check if already joined current season
    const existingEntry = await DailyTrader.findOne({
      userId: new mongoose.Types.ObjectId(String(user._id)),
      seasonId: currentSeasonId,
    });

    if (existingEntry) {
      return NextResponse.json(
        { success: false, error: 'This wallet has already joined this season' },
        { status: 409 }
      );
    }

    // Check token balance
    const { hasBalance, balance } = await hasRequiredTokenBalance(
      wallet, // Use original case-sensitive address
      OP_TOKEN_MINT,
      OP_TOKEN_REQUIRED,
      SOLANA_RPC_ENDPOINT
    );

    if (!hasBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient $PRINT tokens. Required: ${OP_TOKEN_REQUIRED.toLocaleString()}, Balance: ${balance.toLocaleString()}`,
          data: {
            required: OP_TOKEN_REQUIRED,
            balance: balance,
          },
        },
        { status: 403 }
      );
    }

    console.log(`✅ Wallet has sufficient tokens (${balance} >= ${OP_TOKEN_REQUIRED})`);

    // Create DailyTrader entry
    const dailyTrader = await DailyTrader.create({
      userId: new mongoose.Types.ObjectId(String(user._id)),
      seasonId: currentSeasonId,
      wallet: walletLowercase,
      walletOriginal: wallet,
      tokenBalance: balance,
      availableBalanceSol: 0,
      totalPnl: 0,
      totalTrades: 0,
      buyCount: 0,
      sellCount: 0,
      realizedUsdPnl: 0,
      realizedSolPnl: 0,
      realizedUsdBought: 0,
      realizedUsdSold: 0,
      usdBought: 0,
      usdSold: 0,
      solBought: 0,
      solSold: 0,
      lastUpdated: new Date(),
    });

    console.log(`✅ DailyTrader entry created for wallet: ${wallet}`);

    return NextResponse.json(
      {
        success: true,
        message: 'Successfully joined the tournament',
        data: {
          wallet,
          tokenBalance: balance,
          seasonId: currentSeasonId,
          traderId: dailyTrader._id,
          userId: user._id,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('❌ Error in join-by-address:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to join tournament' },
      { status: 500 }
    );
  }
}
