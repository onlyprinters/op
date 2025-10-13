import { VersionedTransaction, Connection, Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const SOLANA_RPC_ENDPOINT = process.env.SOLANA_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com';
const DEV_PK = process.env.DEV_PK; // This is the PRIVATE key (base58)
const PUMP_PORTAL_API = 'https://pumpportal.fun/api/trade-local';

/**
 * Claims creator fees from Pump.fun
 * @param priorityFee - Priority fee in SOL (default: 0.000001)
 * @returns Transaction signature or error
 */
export async function claimCreatorFees(priorityFee: number = 0.000001): Promise<{
  success: boolean;
  signature?: string;
  error?: string;
}> {
  try {
    // Validate environment variables
    if (!DEV_PK) {
      throw new Error('DEV_PK not configured in environment');
    }

    // Derive keypair from private key
    const signerKeyPair = Keypair.fromSecretKey(bs58.decode(DEV_PK));
    const publicKey = signerKeyPair.publicKey.toBase58();

    console.log('🎁 Claiming creator fees from Pump Portal...');
    console.log('📍 Public Key:', publicKey);
    console.log('💰 Priority Fee:', priorityFee, 'SOL');

    // Create connection to Solana
    const web3Connection = new Connection(SOLANA_RPC_ENDPOINT, 'confirmed');

    // Request transaction from Pump Portal
    const response = await fetch(PUMP_PORTAL_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        publicKey: publicKey, // Use derived public key
        action: 'collectCreatorFee',
        priorityFee: priorityFee,
      }),
    });

    if (response.status !== 200) {
      const errorText = await response.text();
      throw new Error(`Pump Portal API error: ${response.statusText} - ${errorText}`);
    }

    // Deserialize transaction
    const data = await response.arrayBuffer();
    const tx = VersionedTransaction.deserialize(new Uint8Array(data));

    // Sign transaction with developer's private key
    tx.sign([signerKeyPair]);

    // Send transaction
    console.log('📤 Sending transaction to Solana...');
    const signature = await web3Connection.sendTransaction(tx);

    console.log('✅ Transaction sent successfully!');
    console.log('🔗 Solscan:', `https://solscan.io/tx/${signature}`);

    return {
      success: true,
      signature,
    };
  } catch (error) {
    console.error('❌ Error claiming creator fees:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Checks if creator fees are available to claim
 * @returns Object with availability status and estimated amount (if available)
 */
export async function checkCreatorFees(): Promise<{
  success: boolean;
  available: boolean;
  publicKey?: string;
  estimatedAmount?: number;
  error?: string;
}> {
  try {
    if (!DEV_PK) {
      throw new Error('DEV_PK not configured in environment');
    }

    // Derive public key from private key
    const signerKeyPair = Keypair.fromSecretKey(bs58.decode(DEV_PK));
    const publicKey = signerKeyPair.publicKey.toBase58();

    // Note: Pump Portal doesn't provide a direct endpoint to check fees
    // This is a placeholder that could be enhanced with custom logic
    console.log('🔍 Checking creator fees availability...');
    console.log('📍 Public Key:', publicKey);

    // You could implement custom logic here to:
    // 1. Query your token's trading activity
    // 2. Calculate expected fees
    // 3. Check blockchain for pending fee claims

    return {
      success: true,
      available: true, // Assuming fees are available
      publicKey: publicKey,
      estimatedAmount: undefined, // Would require custom calculation
    };
  } catch (error) {
    console.error('❌ Error checking creator fees:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return {
      success: false,
      available: false,
      error: errorMessage,
    };
  }
}
