'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { Trader } from '@/types';
import CountdownTimer from './CountdownTimer';
import { useUser } from '@/contexts/WalletContextProvider';

export default function TraderLeaderboard() {
  const { user } = useUser();
  const [traders, setTraders] = useState<Trader[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [rewardPool, setRewardPool] = useState(0); // SOL amount from dev wallet
  const [copiedWallet, setCopiedWallet] = useState<string | null>(null);

  const copyToClipboard = async (wallet: string) => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopiedWallet(wallet);
      setTimeout(() => setCopiedWallet(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const fetchRewards = useCallback(async () => {
    try {
      const response = await fetch('/api/rewards');
      const result = await response.json();

      if (result.success && result.data) {
        setRewardPool(result.data.rewardsPool);
      }
    } catch (err) {
      console.error('Error fetching rewards:', err);
    }
  }, []);

  const fetchTraders = useCallback(async (isManualRefresh = false) => {
      try {
        if (isManualRefresh) {
          setIsRefreshing(true);
        } else {
          setLoading(true);
        }
        setError(null);

        const response = await fetch('/api/daily-traders');
        const result = await response.json();

        if (result.success && result.data.traders) {
          // Map API data to Trader interface
          const mappedTraders: Trader[] = result.data.traders.map((trader: Trader & { name: string; wallet: string; walletOriginal: string; soldPrint?: boolean }) => ({
            id: trader.id,
            walletAddress: trader.wallet, // API returns 'wallet', not 'walletAddress'
            walletOriginal: trader.walletOriginal, // Original case-sensitive wallet
            avatar: trader.avatar,
            displayName: trader.name,
            availableBalanceSol: trader.availableBalanceSol,
            totalPnl: trader.totalPnl,
            totalTrades: trader.totalTrades,
            buyCount: trader.buyCount,
            sellCount: trader.sellCount,
            pnlBreakdown: trader.pnlBreakdown,
            usdBought: trader.usdBought,
            usdSold: trader.usdSold,
            solBought: trader.solBought,
            solSold: trader.solSold,
            realizedSolPnl: trader.realizedSolPnl,
            realizedSolBought: trader.realizedSolBought,
            realizedSolSold: trader.realizedSolSold,
            realizedUsdPnl: trader.realizedUsdPnl,
            realizedUsdBought: trader.realizedUsdBought,
            realizedUsdSold: trader.realizedUsdSold,
            joinedAt: new Date(trader.joinedAt),
            soldPrint: trader.soldPrint || false,
          }));

          setTraders(mappedTraders);
          setLastUpdated(new Date()); // Update timestamp
        } else {
          setError(result.error || 'Failed to fetch traders');
        }
      } catch (err) {
        console.error('Error fetching traders:', err);
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
        setIsRefreshing(false);
      }
  }, []);

  useEffect(() => {
    // Initial fetch
    fetchTraders();
    fetchRewards(); // Fetch rewards on load
    
    // Auto-refresh every 30 seconds (only when page is visible)
    const autoRefreshInterval = setInterval(() => {
      // Check if page is visible (user is on the tab)
      if (!document.hidden) {
        console.log('🔄 Auto-refreshing leaderboard (30s interval)');
        fetchTraders(true); // Silent refresh
      } else {
        console.log('⏭️  Skipping auto-refresh (page hidden)');
      }
    }, 30000); // 30 seconds
    
    // Refresh when user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👀 Page visible - refreshing leaderboard');
        fetchTraders(true);
      }
    };
    
    // Listen for refresh event from Sidebar when user joins
    const handleRefresh = () => {
      console.log('🔄 Refreshing leaderboard after user joined');
      fetchTraders(true); // Manual refresh
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('refreshLeaderboard', handleRefresh);
    
    return () => {
      clearInterval(autoRefreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('refreshLeaderboard', handleRefresh);
    };
  }, [fetchTraders, fetchRewards]);

  const formatUSD = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatSOL = (value: number) => {
    return `${value.toFixed(2)} SOL`;
  };

  const getPnlColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
        <p className="text-red-800 font-semibold mb-2">Error Loading Leaderboard</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    );
  }

  if (traders.length === 0) {
    return (
      <div>
        <CountdownTimer rewardPool={rewardPool} />
        <div className="bg-white rounded-lg shadow-md border border-green-200 p-8 text-center">
          <p className="text-gray-600 text-lg">No traders yet today</p>
          <p className="text-gray-500 text-sm mt-2">Be the first to join!</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Countdown Timer and Rewards */}
      <CountdownTimer rewardPool={rewardPool} />

      {/* Leaderboard Table */}
      <div className="bg-white rounded-lg shadow-md border border-green-200 overflow-hidden">
        {/* Data Update Notice */}
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-3">
          <div className="flex items-center gap-2 text-sm">
            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-blue-800">
              <span className="font-semibold">PNL data recalculated every ~10 minutes</span>
            </span>
          </div>
        </div>

        <div className="p-6 border-b border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                Printers Leaderboard
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Top performers on onlyPrinters
                {lastUpdated && (
                  <span className="text-gray-400 ml-2">
                    • Updated {lastUpdated.toLocaleTimeString()}
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col items-end gap-1">
              {isRefreshing && (
                <div className="flex items-center text-green-600 text-sm">
                  <svg className="animate-spin h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Updating...
                </div>
              )}
              <p className="text-xs text-gray-400">
                🔄 Auto-refreshes every 30s
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-green-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Trader
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  <span className="inline-flex items-center gap-1">
                    🏆 Realized PNL
                  </span>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Total PNL
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Trades
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Volume
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 uppercase tracking-wider">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {traders.map((trader) => {
                const totalTradeVolume = trader.usdBought + trader.usdSold;
                const isCurrentUser = user && trader.walletAddress && user.wallet && 
                  trader.walletAddress.toLowerCase() === user.wallet.toLowerCase();
                
                // Calculate rank: only count traders who haven't sold $PRINT
                const validTraders = traders.filter(t => !t.soldPrint);
                const rankNumber = validTraders.findIndex(t => t.id === trader.id) + 1;
                const isDisqualified = trader.soldPrint;
                
                return (
                  <tr 
                    key={trader.id} 
                    className={`transition-colors ${
                      isCurrentUser 
                        ? 'bg-green-100 hover:bg-green-200 border-l-4 border-green-500' 
                        : isDisqualified
                        ? 'bg-red-50 hover:bg-red-100 opacity-60'
                        : 'hover:bg-green-50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {isDisqualified ? (
                          <span className="text-sm font-bold text-red-600">DQ</span>
                        ) : (
                          <span className={`text-sm font-bold ${isCurrentUser ? 'text-green-700' : 'text-gray-900'}`}>
                            #{rankNumber}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Image
                          className={`h-10 w-10 rounded-full ${isCurrentUser ? 'ring-2 ring-green-500' : ''}`}
                          src={trader.avatar}
                          alt={trader.displayName}
                          width={40}
                          height={40}
                        />
                        <div className="ml-4">
                          <div className={`text-sm font-medium flex items-center gap-2 ${isCurrentUser ? 'text-green-700 font-bold' : 'text-gray-900'}`}>
                            {trader.displayName}
                            {isCurrentUser && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">YOU</span>}
                            {trader.soldPrint && (
                              <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full font-semibold" title="Token balance below required amount">
                                SOLD $PRINT
                              </span>
                            )}
                            <button
                              onClick={() => copyToClipboard(trader.walletOriginal)}
                              className="text-gray-400 hover:text-green-600 transition-colors"
                              title="Copy wallet address"
                            >
                              {copiedWallet === trader.walletOriginal ? (
                                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                              ) : (
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              )}
                            </button>
                          </div>
                          <div className="text-xs text-gray-500">
                            {trader.buyCount} buys / {trader.sellCount} sells
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-lg font-bold ${getPnlColor(trader.realizedUsdPnl)}`}>
                        {formatUSD(trader.realizedUsdPnl)}
                      </div>
                      <div className={`text-xs ${getPnlColor(trader.realizedSolPnl)}`}>
                        {formatSOL(trader.realizedSolPnl)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className={`text-sm ${getPnlColor(trader.totalPnl)}`}>
                        {formatUSD(trader.totalPnl)}
                      </div>
                      <div className="text-xs text-gray-400">
                        Total 24h
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900 font-semibold">{trader.totalTrades}</div>
                      <div className="text-xs text-gray-500">
                        {trader.pnlBreakdown.over500Percent > 0 && (
                          <span className="text-green-600">🚀 {trader.pnlBreakdown.over500Percent}x</span>
                        )}
                        {trader.pnlBreakdown.between200And500Percent > 0 && (
                          <span className="text-green-500"> 🎯 {trader.pnlBreakdown.between200And500Percent}x</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900 font-semibold">
                        {formatUSD(totalTradeVolume)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatSOL(trader.solBought + trader.solSold)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="text-sm text-gray-900">
                        {formatSOL(trader.availableBalanceSol)}
                      </div>
                      <div className="text-xs text-gray-500">
                        Available
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
