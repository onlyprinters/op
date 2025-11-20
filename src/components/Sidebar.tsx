'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useUser } from '@/contexts/WalletContextProvider';
import { useWallet } from '@solana/wallet-adapter-react';
import PlayerCard from './PlayerCard';
import JoinByAddress from './JoinByAddress';

interface DailyTraderData {
  tokenBalance: number;
  availableBalanceSol: number;
  totalPnl: number;
  totalTrades: number;
  buyCount: number;
  sellCount: number;
  realizedUsdPnl: number;
  realizedSolPnl: number;
  realizedUsdBought: number;
  realizedUsdSold: number;
  usdBought: number;
  usdSold: number;
  solBought: number;
  solSold: number;
  pnlBreakdown?: {
    over500Percent: number;
    between200And500Percent: number;
    between0And200Percent: number;
    between0AndNeg50Percent: number;
    underNeg50Percent: number;
  };
}

interface SeasonStats {
  activeTraders: number;
  totalVolumeUsd: number;
  totalTrades: number;
}

export default function Sidebar() {
  const { user } = useUser();
  const { connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasJoined, setHasJoined] = useState(false);
  const [dailyTraderData, setDailyTraderData] = useState<DailyTraderData | null>(null);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [seasonStats, setSeasonStats] = useState<SeasonStats>({
    activeTraders: 0,
    totalVolumeUsd: 0,
    totalTrades: 0,
  });
  const [joinMethod, setJoinMethod] = useState<'wallet' | 'address'>('wallet');

  const checkJoinStatus = useCallback(async () => {
    console.log('🔍 Checking if user joined season', {
      userId: user?.id,
      wallet: user?.wallet
    });

    setHasJoined(false);
    setDailyTraderData(null);
    setMessage(null);
    setCheckingStatus(true);

    if (!user) {
      console.log('❌ No user connected, skipping check');
      setCheckingStatus(false);
      return;
    }

      try {
        const response = await fetch(`/api/daily-traders/join?userId=${user.id}`);
        const result = await response.json();

        if (result.success && result.data.hasJoinedToday && result.data.entry) {
          console.log('✅ User has joined today');
          setHasJoined(true);
          const entry = result.data.entry;
          setDailyTraderData({
            tokenBalance: entry.tokenBalance,
            availableBalanceSol: entry.availableBalanceSol,
            totalPnl: entry.totalPnl,
            totalTrades: entry.totalTrades,
            buyCount: entry.buyCount,
            sellCount: entry.sellCount,
            realizedUsdPnl: entry.realizedUsdPnl,
            realizedSolPnl: entry.realizedSolPnl,
            realizedUsdBought: entry.realizedUsdBought,
            realizedUsdSold: entry.realizedUsdSold,
            usdBought: entry.usdBought,
            usdSold: entry.usdSold,
            solBought: entry.solBought,
            solSold: entry.solSold,
            pnlBreakdown: entry.pnlBreakdown,
          });
        } else {
          console.log('❌ User has not joined today');
          setHasJoined(false);
          setDailyTraderData(null);
        }
      } catch (error) {
        console.error('Error checking join status:', error);
        setHasJoined(false);
        setDailyTraderData(null);
      } finally {
        setCheckingStatus(false);
      }
  }, [user]);

  useEffect(() => {
    // Initial check
    checkJoinStatus();

    // Auto-refresh every 30 seconds (only when page is visible and user exists)
    const autoRefreshInterval = setInterval(() => {
      if (!document.hidden && user) {
        console.log('🔄 Auto-refreshing user data (30s interval)');
        checkJoinStatus(); // Silent refresh - will update data if user has joined
      }
    }, 30000); // 30 seconds

    // Refresh when user returns to the tab
    const handleVisibilityChange = () => {
      if (!document.hidden && user) {
        console.log('👀 Tab visible again, refreshing user data');
        checkJoinStatus();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(autoRefreshInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, checkJoinStatus]); // Depend on user and checkJoinStatus

  useEffect(() => {
    const fetchSeasonStats = async () => {
      try {
        const response = await fetch('/api/season-stats');
        const result = await response.json();

        if (result.success && result.data) {
          setSeasonStats({
            activeTraders: result.data.activeTraders,
            totalVolumeUsd: result.data.totalVolumeUsd,
            totalTrades: result.data.totalTrades,
          });
        }
      } catch (error) {
        console.error('Error fetching season stats:', error);
      }
    };

    fetchSeasonStats();

    const statsInterval = setInterval(() => {
      if (!document.hidden) {
        fetchSeasonStats();
      }
    }, 30000);

    return () => clearInterval(statsInterval);
  }, []);

  const handleJoin = async () => {
    if (!user) {
      setMessage({
        type: 'error',
        text: 'Please connect your wallet first',
      });
      return;
    }

    if (!connected) {
      setMessage({
        type: 'error',
        text: 'Wallet not connected',
      });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('/api/daily-traders/join', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          wallet: user.wallet,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setHasJoined(true);
        setMessage({
          type: 'success',
          text: 'Successfully joined! Good luck! 🎉',
        });

        const statusResponse = await fetch(`/api/daily-traders/join?userId=${user.id}`);
        const statusResult = await statusResponse.json();

        if (statusResult.success && statusResult.data.hasJoinedToday && statusResult.data.entry) {
          const entry = statusResult.data.entry;
          setDailyTraderData({
            tokenBalance: entry.tokenBalance,
            availableBalanceSol: entry.availableBalanceSol,
            totalPnl: entry.totalPnl,
            totalTrades: entry.totalTrades,
            buyCount: entry.buyCount,
            sellCount: entry.sellCount,
            realizedUsdPnl: entry.realizedUsdPnl,
            realizedSolPnl: entry.realizedSolPnl,
            realizedUsdBought: entry.realizedUsdBought,
            realizedUsdSold: entry.realizedUsdSold,
            usdBought: entry.usdBought,
            usdSold: entry.usdSold,
            solBought: entry.solBought,
            solSold: entry.solSold,
            pnlBreakdown: entry.pnlBreakdown,
          });

          // Trigger leaderboard refresh after user joins
          window.dispatchEvent(new Event('refreshLeaderboard'));
        }
      } else {
        setMessage({
          type: 'error',
          text: result.error || 'Failed to join. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error joining:', error);
      setMessage({
        type: 'error',
        text: 'An error occurred. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <aside className="w-full">
        <div className="bg-white rounded-lg shadow-md p-6 border border-green-200">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2 mx-auto"></div>
            </div>
          </div>
        </div>
      </aside>
    );
  }

  if (hasJoined && dailyTraderData && user) {
    return (
      <aside className="w-full">
        <PlayerCard
          wallet={user.walletOriginal}
          name={user.name}
          avatar={user.avatar}
          tokenBalance={dailyTraderData.tokenBalance}
          availableBalanceSol={dailyTraderData.availableBalanceSol}
          totalPnl={dailyTraderData.totalPnl}
          totalTrades={dailyTraderData.totalTrades}
          buyCount={dailyTraderData.buyCount}
          sellCount={dailyTraderData.sellCount}
          realizedUsdPnl={dailyTraderData.realizedUsdPnl}
          realizedSolPnl={dailyTraderData.realizedSolPnl}
          realizedUsdBought={dailyTraderData.realizedUsdBought}
          realizedUsdSold={dailyTraderData.realizedUsdSold}
          usdBought={dailyTraderData.usdBought}
          usdSold={dailyTraderData.usdSold}
          solBought={dailyTraderData.solBought}
          solSold={dailyTraderData.solSold}
          pnlBreakdown={dailyTraderData.pnlBreakdown}
          onStatsUpdated={checkJoinStatus}
        />
      </aside>
    );
  }

  return (
    <aside className="w-full">
      <div className="bg-white rounded-lg shadow-md p-6 border border-green-200">
        <div className="text-center">
          <Link href="/" className="flex justify-center mb-4 cursor-pointer hover:opacity-80 transition-opacity">
            <div className="w-20 h-20 rounded-full overflow-hidden">
              <Image
                src="/logo.png"
                alt="onlyPrinters Logo"
                width={80}
                height={80}
                className="object-cover"
              />
            </div>
          </Link>

          <span className="ml-3 text-2xl font-bold font-[family-name:var(--font-astron-boy)]">
            <span className="text-gray-900">Join </span>

            <span className="text-green-500">Only</span>
            <span className="text-gray-900">Printers</span>
          </span>

          <p className="text-gray-600 text-sm mb-6">
            Compete with the best traders on Solana. Track your performance and climb the leaderboard.
          </p>

          {/* Join Method Tabs */}
          <div className="mb-4 flex rounded-lg bg-gray-100 p-1">
            <button
              onClick={() => setJoinMethod('wallet')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                joinMethod === 'wallet'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Connect Wallet
            </button>
            <button
              onClick={() => setJoinMethod('address')}
              className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                joinMethod === 'address'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Paste Address
            </button>
          </div>

          {message && (
            <div
              className={`mb-4 p-3 rounded-lg text-sm ${message.type === 'success'
                ? 'bg-green-50 text-green-800 border border-green-200'
                : 'bg-red-50 text-red-800 border border-red-200'
                }`}
            >
              {message.text}
            </div>
          )}

          {/* Join Method Content */}
          {joinMethod === 'wallet' ? (
            /* Sign Up Button */
            <button
              onClick={handleJoin}
              disabled={loading || hasJoined || !connected}
              className={`w-full font-semibold py-3 px-4 rounded-lg transition-colors shadow-sm hover:shadow-md ${loading || hasJoined || !connected
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
            >
              {loading ? 'Checking...' : hasJoined ? 'Joined Today!' : connected ? 'Sign Up Now' : 'Connect Wallet'}
            </button>
          ) : (
            /* Join by Address Form */
            <JoinByAddress
              onSuccess={() => {
                setMessage({
                  type: 'success',
                  text: 'Wallet successfully joined! 🎉',
                });
                // Trigger leaderboard refresh
                window.dispatchEvent(new Event('refreshLeaderboard'));
              }}
            />
          )}

          {/* Stats */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Traders</span>
                <span className="font-semibold text-gray-900">
                  {seasonStats.activeTraders.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Volume</span>
                <span className="font-semibold text-gray-900">
                  {seasonStats.totalVolumeUsd >= 1000000
                    ? `$${(seasonStats.totalVolumeUsd / 1000000).toFixed(1)}M`
                    : seasonStats.totalVolumeUsd >= 1000
                      ? `$${(seasonStats.totalVolumeUsd / 1000).toFixed(1)}K`
                      : `$${seasonStats.totalVolumeUsd.toFixed(0)}`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Trades</span>
                <span className="font-semibold text-gray-900">
                  {seasonStats.totalTrades.toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
