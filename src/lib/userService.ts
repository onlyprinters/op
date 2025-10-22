import { generateSignMessage } from './signMessage';
import bs58 from 'bs58';

// Client-side service for user registration and login

// LocalStorage key for JWT token
const TOKEN_STORAGE_KEY = 'onlyprinters_auth_token';

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
  token?: string; // JWT token for session
}

/**
 * Save JWT token to localStorage
 */
function saveToken(token: string): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
}

/**
 * Get JWT token from localStorage
 */
function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }
  return null;
}

/**
 * Clear JWT token from localStorage
 */
export function clearToken(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
  }
}

/**
 * Try to get user data using existing JWT token
 * Returns user data if token is valid, null otherwise
 */
export async function getUserFromToken(): Promise<UserData | null> {
  const token = getToken();
  if (!token) return null;

  try {
    const response = await fetch('/api/users/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (response.ok) {
      const result: ApiResponse = await response.json();
      if (result.success && result.data) {
        console.log('✅ User authenticated via token');
        return result.data;
      }
    }

    // Token invalid/expired, clear it
    clearToken();
    return null;
  } catch (error) {
    console.error('❌ Error validating token:', error);
    clearToken();
    return null;
  }
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
        
        // Save JWT token to localStorage
        if (result.token) {
          saveToken(result.token);
          console.log('🔑 Session token saved');
        }
        
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
