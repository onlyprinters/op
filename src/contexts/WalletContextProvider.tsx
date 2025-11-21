'use client';

import React, { useMemo, createContext, useContext, useState, useEffect } from 'react';
import {
  ConnectionProvider,
  WalletProvider,
  useWallet,
} from '@solana/wallet-adapter-react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import {
  WalletModalProvider,
} from '@solana/wallet-adapter-react-ui';
import { clusterApiUrl } from '@solana/web3.js';
import { registerOrLoginUser, getUserFromToken, clearToken, UserData } from '@/lib/userService';

// Import wallet adapter styles
import '@solana/wallet-adapter-react-ui/styles.css';

// User Context
interface UserContextType {
  user: UserData | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType>({
  user: null,
  loading: false,
  refreshUser: async () => {},
});

export const useUser = () => useContext(UserContext);

// User Provider Component - listens to wallet changes
function UserProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected, signMessage } = useWallet();
  const [user, setUser] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(false);

  const refreshUser = async () => {
    // If wallet is not connected, clear user and token
    if (!publicKey || !connected) {
      console.log('🔌 Wallet not connected, clearing user data');
      setUser(null);
      setLoading(false);
      clearToken(); // Clear token from localStorage
      return;
    }

    setLoading(true);
    try {
      const walletAddress = publicKey.toBase58();
      console.log('🔄 Refreshing user for wallet:', walletAddress);
      
      // First, try to authenticate with existing token
      const tokenUser = await getUserFromToken();
      
      if (tokenUser && tokenUser.wallet.toLowerCase() === walletAddress.toLowerCase()) {
        console.log('✅ User authenticated via token (no signature required)');
        setUser(tokenUser);
        setLoading(false);
        return;
      }
      
      // Token invalid or doesn't match wallet - request signature
      console.log('🔑 Token invalid/missing, requesting signature...');
      
      if (!signMessage) {
        console.log('⚠️ signMessage not available');
        setUser(null);
        setLoading(false);
        return;
      }
      
      const userData = await registerOrLoginUser(walletAddress, signMessage);
      
      if (userData) {
        console.log('✅ User data loaded:', userData.wallet);
        setUser(userData);
      } else {
        console.log('⚠️ No user data returned (signature rejected or error)');
        setUser(null);
      }
    } catch (error) {
      // Handle WalletDisconnectedError gracefully
      const err = error as Error;
      if (err?.name === 'WalletDisconnectedError' || err?.message?.includes('disconnected')) {
        console.log('🔌 Wallet disconnected during refresh, clearing user');
      } else {
        console.error('❌ Error refreshing user:', error);
      }
      setUser(null);
      clearToken();
    } finally {
      setLoading(false);
    }
  };

  // Auto register/login when wallet connects
  useEffect(() => {
    // Only refresh if wallet is actually connected
    // This prevents race conditions during wallet switching
    if (connected && publicKey) {
      console.log('🔄 Wallet connection changed, refreshing user');
      refreshUser();
    } else if (!connected) {
      console.log('🔌 Wallet disconnected, clearing user');
      setUser(null);
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicKey, connected]);

  return (
    <UserContext.Provider value={{ user, loading, refreshUser }}>
      {children}
    </UserContext.Provider>
  );
}

interface WalletContextProviderProps {
  children: React.ReactNode;
}

export function WalletContextProvider({ children }: WalletContextProviderProps) {
  // The network can be set to 'devnet', 'testnet', or 'mainnet-beta'.
  const network = WalletAdapterNetwork.Devnet;

  // You can also provide a custom RPC endpoint.
  const endpoint = useMemo(() => clusterApiUrl(network), [network]);

  const wallets = useMemo(
    () => [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [network]
  );

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <UserProvider>
            {children}
          </UserProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
}