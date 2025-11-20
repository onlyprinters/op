'use client';

import { useState } from 'react';
import { PublicKey } from '@solana/web3.js';

interface CheckWalletResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: {
    wallet: string;
    tokenBalance: number;
    requiredBalance: number;
    isValid: boolean;
  };
}

interface JoinByAddressProps {
  onSuccess?: () => void;
}

export default function JoinByAddress({ onSuccess }: JoinByAddressProps) {
  const [walletAddress, setWalletAddress] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [validationResult, setValidationResult] = useState<CheckWalletResponse | null>(null);
  const [addressError, setAddressError] = useState<string | null>(null);

  // Client-side Solana address validation
  const validateSolanaAddress = (address: string): boolean => {
    if (!address || address.trim() === '') {
      setAddressError(null);
      return false;
    }

    try {
      const publicKey = new PublicKey(address);
      if (!PublicKey.isOnCurve(publicKey.toBytes())) {
        setAddressError('Invalid Solana address format');
        return false;
      }
      setAddressError(null);
      return true;
    } catch {
      setAddressError('Invalid Solana address format');
      return false;
    }
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    setWalletAddress(value);
    setValidationResult(null);
    
    if (value) {
      validateSolanaAddress(value);
    } else {
      setAddressError(null);
    }
  };

  const handleCheckEligibility = async () => {
    if (!validateSolanaAddress(walletAddress)) {
      return;
    }

    setIsValidating(true);
    setValidationResult(null);

    try {
      const response = await fetch('/api/daily-traders/check-wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: walletAddress }),
      });

      const result: CheckWalletResponse = await response.json();
      setValidationResult(result);

      if (result.success) {
        console.log('✅ Wallet is eligible:', result.data);
      } else {
        console.log('⚠️ Wallet is not eligible:', result.error);
      }
    } catch (error) {
      console.error('❌ Error checking wallet:', error);
      setValidationResult({
        success: false,
        error: 'Failed to check wallet eligibility. Please try again.',
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleJoinTournament = async () => {
    if (!validationResult?.success || !validationResult.data?.isValid) {
      return;
    }

    setIsJoining(true);

    try {
      // Use new join-by-address endpoint (no authentication required)
      const response = await fetch('/api/daily-traders/join-by-address', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet: walletAddress }),
      });

      const result = await response.json();

      if (result.success) {
        console.log('✅ Successfully joined tournament:', result.data);
        setWalletAddress('');
        setValidationResult(null);
        setAddressError(null);
        onSuccess?.();
      } else {
        setValidationResult({
          success: false,
          error: result.error || 'Failed to join tournament',
        });
      }
    } catch (error) {
      console.error('❌ Error joining tournament:', error);
      setValidationResult({
        success: false,
        error: 'Failed to join tournament. Please try again.',
      });
    } finally {
      setIsJoining(false);
    }
  };

  const getBorderColor = () => {
    if (!walletAddress) return 'border-gray-700';
    if (addressError) return 'border-red-500';
    if (validationResult?.success) return 'border-green-500';
    if (validationResult && !validationResult.success) return 'border-red-500';
    return 'border-gray-700';
  };

  return (
    <div className="space-y-4">
      <div>
        <label htmlFor="wallet-address" className="block text-sm font-medium text-gray-300 mb-2">
          Solana Wallet Address
        </label>
        <input
          id="wallet-address"
          type="text"
          value={walletAddress}
          onChange={handleAddressChange}
          placeholder="Enter Solana wallet address..."
          className={`w-full px-4 py-3 bg-gray-800 border ${getBorderColor()} rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors`}
          disabled={isValidating || isJoining}
        />
        {addressError && (
          <p className="mt-1 text-sm text-red-500">{addressError}</p>
        )}
      </div>

      {validationResult && (
        <div className={`p-4 rounded-lg ${validationResult.success ? 'bg-green-900/20 border border-green-500' : 'bg-red-900/20 border border-red-500'}`}>
          {validationResult.success && validationResult.data ? (
            <div className="space-y-2">
              <p className="text-green-400 font-medium">✅ Wallet is eligible!</p>
              <div className="text-sm text-gray-300 space-y-1">
                <p>Token Balance: <span className="font-mono text-green-400">{validationResult.data.tokenBalance.toFixed(2)}</span></p>
                <p>Required: <span className="font-mono text-gray-400">{validationResult.data.requiredBalance.toFixed(2)}</span></p>
              </div>
            </div>
          ) : (
            <p className="text-red-400">❌ {validationResult.error}</p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <button
          onClick={handleCheckEligibility}
          disabled={!walletAddress || !!addressError || isValidating || isJoining}
          className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
        >
          {isValidating ? 'Checking...' : 'Check Eligibility'}
        </button>

        {validationResult?.success && validationResult.data?.isValid && (
          <button
            onClick={handleJoinTournament}
            disabled={isJoining}
            className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold rounded-lg transition-colors"
          >
            {isJoining ? 'Joining...' : 'Join Tournament'}
          </button>
        )}
      </div>

      <p className="text-xs text-gray-500 text-center">
        Enter any Solana wallet address to check eligibility and join the tournament
      </p>
    </div>
  );
}
