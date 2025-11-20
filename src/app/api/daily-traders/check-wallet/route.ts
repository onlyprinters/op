 import { NextRequest, NextResponse } from 'next/server';
import { PublicKey } from '@solana/web3.js';
import { getTokenBalance } from '@/lib/tokenService';

/**
 * POST /api/daily-traders/check-wallet
 * Validates Solana address and checks if it holds required $PRINT tokens
 * Used for manual wallet entry (paste address instead of connecting wallet)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { wallet } = body;

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
      
      // Additional check: Solana addresses should be base58 encoded 32-44 characters
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

    // Get token mint address from environment
    const tokenMintAddress = process.env.OP_TOKEN_MINT;
    if (!tokenMintAddress) {
      console.error('❌ OP_TOKEN_MINT not configured in environment');
      return NextResponse.json(
        { success: false, error: 'Token configuration missing' },
        { status: 500 }
      );
    }

    // Get required token balance from environment (default to 0)
    const requiredBalance = parseFloat(process.env.OP_TOKEN_REQUIRED || '0');

    console.log(`🔍 Checking wallet ${wallet} for token balance...`);

    // Check token balance
    const tokenBalance = await getTokenBalance(wallet, tokenMintAddress);

    console.log(`💰 Wallet ${wallet} has ${tokenBalance} tokens (required: ${requiredBalance})`);

    // Check if wallet has enough tokens
    if (tokenBalance < requiredBalance) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient token balance. Required: ${requiredBalance}, Current: ${tokenBalance}`,
          data: {
            tokenBalance,
            requiredBalance,
            isValid: false,
          },
        },
        { status: 403 }
      );
    }

    // Wallet is valid and has enough tokens
    return NextResponse.json(
      {
        success: true,
        message: 'Wallet is valid and has sufficient token balance',
        data: {
          wallet,
          tokenBalance,
          requiredBalance,
          isValid: true,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error checking wallet:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate wallet' },
      { status: 500 }
    );
  }
}
