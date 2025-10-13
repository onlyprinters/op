import { Connection, PublicKey } from '@solana/web3.js';
import { getAccount, getAssociatedTokenAddress, getMint } from '@solana/spl-token';

/**
 * Get user's token balance for a specific token mint
 * Returns the actual token amount (adjusted for decimals)
 */
export async function getTokenBalance(
  walletAddress: string,
  tokenMintAddress: string,
  rpcEndpoint: string = 'https://api.mainnet-beta.solana.com'
): Promise<number> {
  try {
    console.log('🔍 Checking token balance:');
    console.log('  Wallet:', walletAddress);
    console.log('  Token Mint:', tokenMintAddress);
    console.log('  RPC Endpoint:', rpcEndpoint);
    
    const connection = new Connection(rpcEndpoint, 'confirmed');
    
    // Validate wallet address
    let walletPublicKey: PublicKey;
    try {
      walletPublicKey = new PublicKey(walletAddress);
    } catch {
      console.error('❌ Invalid wallet address:', walletAddress);
      return 0;
    }

    // Validate mint address
    let mintPublicKey: PublicKey;
    try {
      mintPublicKey = new PublicKey(tokenMintAddress);
    } catch {
      console.error('❌ Invalid token mint address:', tokenMintAddress);
      return 0;
    }

    // Get mint info to get decimals
    const mintInfo = await getMint(connection, mintPublicKey);
    const decimals = mintInfo.decimals;
    console.log('  Token Decimals:', decimals);

    // Get the associated token account address
    const tokenAccountAddress = await getAssociatedTokenAddress(
      mintPublicKey,
      walletPublicKey
    );
    
    console.log('  Token Account Address:', tokenAccountAddress.toBase58());

    // Get the token account info
    try {
      const tokenAccount = await getAccount(connection, tokenAccountAddress);
      const rawBalance = Number(tokenAccount.amount);
      // Adjust for decimals (e.g., 6974639 with 6 decimals = 6.974639 tokens)
      const actualBalance = rawBalance / Math.pow(10, decimals);
      console.log('  Raw Balance:', rawBalance);
      console.log('✅ Actual Token Balance:', actualBalance);
      return actualBalance;
    } catch (accountError) {
      // Token account doesn't exist - user has 0 balance
      console.log(`❌ Token account not found for wallet ${walletAddress}. Balance: 0`);
      console.log('Error details:', accountError);
      return 0;
    }
  } catch (error) {
    console.error('Error getting token balance:', error);
    // If validation or connection error, return 0
    return 0;
  }
}

/**
 * Check if user has required token balance
 */
export async function hasRequiredTokenBalance(
  walletAddress: string,
  tokenMintAddress: string,
  requiredAmount: number,
  rpcEndpoint?: string
): Promise<{ hasBalance: boolean; balance: number }> {
  const balance = await getTokenBalance(walletAddress, tokenMintAddress, rpcEndpoint);
  
  return {
    hasBalance: balance >= requiredAmount,
    balance: balance,
  };
}
