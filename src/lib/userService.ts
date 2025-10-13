import { generateSignMessage } from './signMessage';
import bs58 from 'bs58';

// Client-side service for user registration and login

export interface UserData {
  id: string;
  wallet: string;
  walletOriginal: string; // Original case-sensitive wallet address
  name: string;
  avatar: string;
  createdAt: string;
  updatedAt?: string;
}

interface ApiResponse {
  success: boolean;
  data?: UserData;
  error?: string;
}

/**
 * Register or login user by wallet address with signature verification
 * Requires wallet adapter's signMessage function
 */
export async function registerOrLoginUser(
  walletAddress: string,
  signMessage: (message: Uint8Array) => Promise<Uint8Array>
): Promise<UserData | null> {
  try {
    // Generate message to sign
    const message = generateSignMessage(walletAddress);
    console.log('📝 Message to sign:', message);

    // Request signature from wallet
    const messageBytes = new TextEncoder().encode(message);
    let signatureBytes: Uint8Array;
    
    try {
      signatureBytes = await signMessage(messageBytes);
      console.log('✅ Message signed successfully');
    } catch (error) {
      const err = error as Error;
      
      // Handle different wallet errors gracefully
      if (err?.name === 'WalletDisconnectedError' || err?.message?.includes('disconnected')) {
        console.log('🔌 Wallet disconnected before signing');
      } else if (err?.name === 'WalletSignMessageError' || err?.message?.includes('User rejected')) {
        console.log('❌ User rejected signature request');
      } else {
        console.error('❌ Error during signature request:', error);
      }
      return null;
    }

    // Encode signature to base58
    const signature = bs58.encode(signatureBytes);

    // Generate name from first 5 characters of wallet
    const name = walletAddress.substring(0, 5);

    // Send registration/login request with signature
    const registerResponse = await fetch('/api/users/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        wallet: walletAddress,
        name: name,
        message: message,
        signature: signature,
      }),
    });

    if (registerResponse.ok) {
      const result: ApiResponse = await registerResponse.json();
      if (result.success && result.data) {
        console.log('✅ User authenticated:', result.data);
        return result.data;
      }
    } else {
      const errorResult: ApiResponse = await registerResponse.json();
      console.error('❌ Authentication failed:', errorResult.error);
    }

    return null;
  } catch (error) {
    console.error('❌ Error in registerOrLoginUser:', error);
    return null;
  }
}

/**
 * Get user by wallet address
 */
export async function getUserByWallet(walletAddress: string): Promise<UserData | null> {
  try {
    const response = await fetch(`/api/users/register?wallet=${encodeURIComponent(walletAddress)}`);
    
    if (response.ok) {
      const result: ApiResponse = await response.json();
      if (result.success && result.data) {
        return result.data;
      }
    }
    
    return null;
  } catch (error) {
    console.error('❌ Error fetching user:', error);
    return null;
  }
}
