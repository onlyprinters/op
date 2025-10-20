import { Connection, Keypair, LAMPORTS_PER_SOL, PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import bs58 from 'bs58';
import connectDB from './mongodb';
import DailyTrader from '@/models/DailyTrader';
import User from '@/models/User';
import Draw from '@/models/Draw';
import { getCurrentSeasonId } from './seasonUtils';

// Get creator rewards pool balance
async function getCreatorRewardsBalance(): Promise<number> {
  try {
    const connection = new Connection(
      process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    const devPrivateKey = process.env.DEV_PK;
    if (!devPrivateKey) {
      throw new Error('DEV_PK not found in environment variables');
    }

    const keypair = Keypair.fromSecretKey(bs58.decode(devPrivateKey));
    const balance = await connection.getBalance(keypair.publicKey);
    
    return balance / LAMPORTS_PER_SOL;
  } catch (error) {
    console.error('Error getting creator rewards balance:', error);
    throw error;
  }
}

// Generate draw ID: YYYY-MM-DD-HH
function generateDrawId(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hour = String(date.getUTCHours()).padStart(2, '0');
  return `${year}-${month}-${day}-${hour}`;
}

// Perform weighted random selection
function weightedRandomSelection(participants: Array<{ rank: number; winChance: number; userId: unknown }>): number {
  const random = Math.random() * 100; // 0-100
  let cumulativeChance = 0;

  for (const participant of participants) {
    cumulativeChance += participant.winChance;
    if (random <= cumulativeChance) {
      return participant.rank;
    }
  }

  // Fallback to rank 1 (should never happen)
  return 1;
}

// Send SOL to winner
async function sendPrizeToWinner(winnerWallet: string, amount: number): Promise<{ signature: string; url: string }> {
  try {
    const connection = new Connection(
      process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com',
      'confirmed'
    );

    const devPrivateKey = process.env.DEV_PK;
    if (!devPrivateKey) {
      throw new Error('DEV_PK not found in environment variables');
    }

    const fromKeypair = Keypair.fromSecretKey(bs58.decode(devPrivateKey));
    const toPublicKey = new PublicKey(winnerWallet);

    // Convert SOL to lamports with proper rounding to avoid floating point issues
    // Math.floor ensures we get an integer (no fractional lamports)
    const lamports = Math.floor(amount * LAMPORTS_PER_SOL);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: fromKeypair.publicKey,
        toPubkey: toPublicKey,
        lamports: lamports,
      })
    );

    const signature = await connection.sendTransaction(transaction, [fromKeypair]);
    await connection.confirmTransaction(signature, 'confirmed');

    const url = `https://solscan.io/tx/${signature}`;

    return { signature, url };
  } catch (error) {
    console.error('Error sending prize:', error);
    throw error;
  }
}

// Main draw function
export async function performDraw(): Promise<{ success: boolean; drawId?: string; error?: string }> {
  try {
    await connectDB();
    await User.init();

    const now = new Date();
    const drawId = generateDrawId(now);
    const seasonId = getCurrentSeasonId();

    console.log(`🎲 [DRAW] Starting draw ${drawId} for season ${seasonId}`);

    // Check if draw already exists
    const existingDraw = await Draw.findOne({ drawId });
    if (existingDraw) {
      console.log(`⏭️ [DRAW] Draw ${drawId} already completed`);
      return { success: true, drawId };
    }

    // Get top 3 traders by realized PNL
    const topTraders = await DailyTrader.find({
      seasonId,
      isActive: true,
    })
      .populate('userId', 'name avatar wallet walletOriginal')
      .sort({ realizedUsdPnl: -1 })
      .limit(3)
      .lean();

    if (topTraders.length < 3) {
      console.log(`⏭️ [DRAW] Not enough traders (found ${topTraders.length}, need 3)`);
      return { success: false, error: 'Not enough participants' };
    }

    // Get creator rewards pool
    const totalPool = await getCreatorRewardsBalance();
    const prizeAmount = totalPool * 0.1; // 10% of pool

    console.log(`💰 [DRAW] Total pool: ${totalPool.toFixed(3)} SOL, Prize: ${prizeAmount.toFixed(3)} SOL`);

    // Prepare participants with win chances
    const participants = topTraders.map((trader, index) => {
      const user = trader.userId as unknown as { name: string; avatar: string; wallet: string; walletOriginal: string };
      const rank = index + 1;
      const winChance = rank === 1 ? 40 : rank === 2 ? 35 : 25;

      return {
        userId: trader.userId,
        wallet: user.wallet,
        walletOriginal: user.walletOriginal,
        name: user.name,
        avatar: user.avatar,
        rank,
        realizedPnl: trader.realizedUsdPnl,
        winChance,
      };
    });

    console.log('🎯 [DRAW] Participants:');
    participants.forEach(p => {
      console.log(`  #${p.rank}: ${p.name} - ${p.realizedPnl.toFixed(2)} USD PNL (${p.winChance}% chance)`);
    });

    // Perform weighted random selection
    const winnerRank = weightedRandomSelection(participants);
    const winner = participants.find(p => p.rank === winnerRank)!;

    console.log(`🏆 [DRAW] Winner: ${winner.name} (Rank #${winner.rank})`);

    // Send prize to winner
    console.log(`💸 [DRAW] Sending ${prizeAmount.toFixed(3)} SOL to ${winner.walletOriginal}...`);
    const { signature, url } = await sendPrizeToWinner(winner.walletOriginal, prizeAmount);

    console.log(`✅ [DRAW] Transaction confirmed: ${signature}`);

    // Save draw to database
    const draw = new Draw({
      drawId,
      seasonId,
      drawTime: now,
      participants,
      winnerId: winner.userId,
      winnerWallet: winner.walletOriginal,
      winnerName: winner.name,
      winnerRank: winner.rank,
      prizeAmount,
      totalPoolAtDraw: totalPool,
      txSignature: signature,
      txUrl: url,
      status: 'completed',
    });

    await draw.save();

    console.log(`✅ [DRAW] Draw ${drawId} completed successfully!`);

    return { success: true, drawId };
  } catch (error) {
    console.error('❌ [DRAW] Error performing draw:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Check if it's time for a draw (every 2 hours at even hours)
export async function shouldPerformDraw(): Promise<boolean> {
  const now = new Date();
  const currentHour = now.getUTCHours();

  // Draw happens only at even hours (00, 02, 04, 06, 08, 10, 12, 14, 16, 18, 20, 22)
  const isEvenHour = currentHour % 2 === 0;
  
  if (!isEvenHour) {
    return false;
  }

  // Check if draw already exists for this hour
  const drawId = generateDrawId(now);
  
  try {
    await connectDB();
    const existingDraw = await Draw.findOne({ drawId });
    
    if (existingDraw) {
      // Draw already performed for this hour
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking if draw should be performed:', error);
    return false;
  }
}
