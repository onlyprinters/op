import { NextResponse } from 'next/server';
import { Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const DEV_PK = process.env.DEV_PK; // This is actually the PRIVATE key (base58)

// GET endpoint to fetch rewards (50% of dev wallet balance)
export async function GET() {
  console.log('🎁 GET /api/rewards - Fetching rewards from fees');
  
  try {
    if (!DEV_PK) {
      return NextResponse.json(
        { success: false, error: 'DEV_PK not configured' },
        { status: 500 }
      );
    }

    // Derive public key from private key
    let devKeypair: Keypair;
    try {
      devKeypair = Keypair.fromSecretKey(bs58.decode(DEV_PK));
    } catch (error) {
      console.error('Invalid DEV_PK (private key):', error);
      return NextResponse.json(
        { success: false, error: 'Invalid developer wallet private key' },
        { status: 500 }
      );
    }
    
    const devPublicKey = devKeypair.publicKey;

    // Connect to Solana and fetch balance
    const connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');
    const balanceLamports = await connection.getBalance(devPublicKey);
    
    // Convert lamports to SOL (1 SOL = 1,000,000,000 lamports)
    const balanceSOL = balanceLamports / 1_000_000_000;
    
    // Calculate 50% as rewards
    const rewardsSOL = balanceSOL * 0.5;

    console.log('💰 Dev wallet balance:', balanceSOL, 'SOL');
    console.log('🎁 Rewards (50%):', rewardsSOL, 'SOL');

    return NextResponse.json({
      success: true,
      data: {
        devWallet: devPublicKey.toBase58(), // Return public key, not private!
        totalBalance: balanceSOL,
        rewardsPool: rewardsSOL,
        percentage: 50,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error fetching rewards:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch rewards' },
      { status: 500 }
    );
  }
}
