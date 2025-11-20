'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useUser } from '@/contexts/WalletContextProvider';

interface PlayerCardProps {
  name: string;
  avatar: string;
  wallet: string;
  tokenBalance: number;
  
  // Balance
  availableBalanceSol: number;
  
  // Overall Performance
  totalPnl: number;
  totalTrades: number;
  
  // Trade Counts
  buyCount: number;
  sellCount: number;
  
  // Realized PNL
  realizedUsdPnl: number;
  realizedSolPnl: number;
  realizedUsdBought: number;
  realizedUsdSold: number;
  
  // USD Metrics
  usdBought: number;
  usdSold: number;
  
  // SOL Metrics
  solBought: number;
  solSold: number;
  
  // PNL Breakdown
  pnlBreakdown?: {
    over500Percent: number;
    between200And500Percent: number;
    between0And200Percent: number;
    between0AndNeg50Percent: number;
    underNeg50Percent: number;
  };
  
  // Callback to refresh data after recalculation
  onStatsUpdated?: () => void;
}

export default function PlayerCard({
  name,
  avatar,
  wallet,
  tokenBalance = 0,
  availableBalanceSol = 0,
  totalPnl = 0,
  totalTrades = 0,
  buyCount = 0,
  sellCount = 0,
  realizedUsdPnl = 0,
  realizedSolPnl = 0,
  realizedUsdBought = 0,
  realizedUsdSold = 0,
  usdBought = 0,
  usdSold = 0,
  solBought = 0,
  solSold = 0,
  pnlBreakdown,
  onStatsUpdated,
}: PlayerCardProps) {
  const { refreshUser } = useUser();
  const isProfitable = totalPnl >= 0;
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [recalcMessage, setRecalcMessage] = useState<string | null>(null);
  
  // Name editing
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isSavingName, setIsSavingName] = useState(false);
  const [changesRemaining, setChangesRemaining] = useState<number | null>(null);

  const validateName = (newName: string): boolean => {
    if (!newName || newName.trim() === '') {
      setNameError('Name cannot be empty');
      return false;
    }
    
    if (newName.length > 50) {
      setNameError('Name must be 50 characters or less');
      return false;
    }
    
    // Only letters, numbers, dots, and underscores
    const nameRegex = /^[a-zA-Z0-9._]+$/;
    if (!nameRegex.test(newName)) {
      setNameError('Only letters, numbers, dots (.) and underscores (_) allowed');
      return false;
    }
    
    setNameError(null);
    return true;
  };

  const handleSaveName = async () => {
    if (!validateName(editedName)) {
      return;
    }

    setIsSavingName(true);
    setNameError(null);

    try {
      const token = localStorage.getItem('onlyprinters_auth_token');
      if (!token) {
        setNameError('Authentication required');
        return;
      }

      const response = await fetch('/api/users/update-name', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name: editedName.trim() }),
      });

      const result = await response.json();

      if (result.success) {
        setIsEditingName(false);
        setRecalcMessage('✅ Name updated successfully!');
        // Update changes remaining
        if (result.data?.changesRemaining !== undefined) {
          setChangesRemaining(result.data.changesRemaining);
        }
        // Refresh user context
        await refreshUser();
        // Refresh parent component data
        if (onStatsUpdated) {
          onStatsUpdated();
        }
        setTimeout(() => {
          setRecalcMessage(null);
        }, 3000);
      } else {
        setNameError(result.error || 'Failed to update name');
      }
    } catch (error) {
      console.error('Error updating name:', error);
      setNameError('Network error. Please try again.');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleCancelEdit = () => {
    setEditedName(name);
    setIsEditingName(false);
    setNameError(null);
  };

  const handleStartEdit = async () => {
    setIsEditingName(true);
    
    // Fetch remaining changes
    try {
      const token = localStorage.getItem('onlyprinters_auth_token');
      if (!token) return;

      const response = await fetch('/api/users/name-changes-remaining', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const result = await response.json();
      if (result.success && result.data) {
        setChangesRemaining(result.data.changesRemaining);
      }
    } catch (error) {
      console.error('Error fetching name changes:', error);
    }
  };

  const handleRecalculate = async () => {
    setIsRecalculating(true);
    setRecalcMessage(null);

    try {
      const response = await fetch('/api/daily-traders/recalculate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ wallet }),
      });

      const data = await response.json();

      if (data.success) {
        setRecalcMessage('✅ Stats updated successfully!');
        // Call parent callback to refresh PlayerCard data
        if (onStatsUpdated) {
          onStatsUpdated();
        }
        // Trigger leaderboard refresh
        window.dispatchEvent(new Event('refreshLeaderboard'));
        // Clear success message after 3 seconds
        setTimeout(() => {
          setRecalcMessage(null);
        }, 3000);
      } else {
        setRecalcMessage(data.error || '❌ Failed to recalculate');
      }
    } catch (error) {
      console.error('Recalculation error:', error);
      setRecalcMessage('❌ Network error. Please try again.');
    } finally {
      setIsRecalculating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 border border-green-200">
      <div className="text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-green-500">
            <Image
              src={avatar}
              alt={name}
              width={80}
              height={80}
              className="object-cover"
            />
          </div>
        </div>

        {/* Name with Edit Button */}
        {isEditingName ? (
          <div className="mb-2">
            <input
              type="text"
              value={editedName}
              onChange={(e) => {
                setEditedName(e.target.value);
                validateName(e.target.value);
              }}
              className={`w-full px-3 py-2 text-center text-lg font-bold border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 ${
                nameError ? 'border-red-400' : 'border-gray-300'
              }`}
              maxLength={50}
              disabled={isSavingName}
            />
            {nameError && (
              <p className="text-xs text-red-600 mt-1">{nameError}</p>
            )}
            {changesRemaining !== null && changesRemaining >= 0 && (
              <p className="text-xs text-gray-600 mt-1">
                {changesRemaining === 0 
                  ? '⚠️ No changes remaining (2/2 used in 24h)' 
                  : `${changesRemaining} change${changesRemaining !== 1 ? 's' : ''} remaining today`}
              </p>
            )}
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleSaveName}
                disabled={isSavingName || !!nameError}
                className="flex-1 px-3 py-1 bg-green-500 hover:bg-green-600 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                {isSavingName ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={handleCancelEdit}
                disabled={isSavingName}
                className="flex-1 px-3 py-1 bg-gray-400 hover:bg-gray-500 disabled:bg-gray-300 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="mb-2">
            <h2 className="text-xl font-bold text-gray-900 inline-block">
              {name}
            </h2>
            <button
              onClick={handleStartEdit}
              className="ml-2 text-gray-500 hover:text-green-600 transition-colors"
              title="Edit name (2 changes per 24h)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 inline" viewBox="0 0 20 20" fill="currentColor">
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
            </button>
            {changesRemaining !== null && changesRemaining >= 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {changesRemaining === 0 
                  ? 'Name change limit reached (2/2)' 
                  : `${changesRemaining}/2 changes remaining today`}
              </p>
            )}
          </div>
        )}
        
        {/* Token Balance */}
        <p className="text-sm text-gray-600 mb-4">
          {tokenBalance.toLocaleString()} $PRINT
        </p>

        {/* Total PNL (24h) */}
        <div className="mb-4 p-3 rounded-lg bg-gradient-to-r from-green-50 to-green-100 border border-green-200">
          <div className="text-xs text-gray-600 mb-1">Total PNL (24h)</div>
          <div className={`text-2xl font-bold ${
            isProfitable ? 'text-green-600' : 'text-red-600'
          }`}>
            {isProfitable ? '+' : ''}{totalPnl.toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD',
              minimumFractionDigits: 2,
            })}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="space-y-3 text-left">
          {/* 🏆 Realized PNL (Primary Metric) */}
          <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-300">
            <span className="text-sm font-semibold text-gray-700">🏆 Realized PNL</span>
            <div className="text-right">
              <div className={`text-base font-bold ${
                realizedUsdPnl >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {realizedUsdPnl >= 0 ? '+' : ''}{realizedUsdPnl.toLocaleString('en-US', {
                  style: 'currency',
                  currency: 'USD',
                  minimumFractionDigits: 2,
                })}
              </div>
              <div className={`text-xs font-semibold ${
                realizedSolPnl >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {realizedSolPnl >= 0 ? '+' : ''}{realizedSolPnl.toFixed(3)} SOL
              </div>
            </div>
          </div>

          {/* Available Balance */}
          <div className="flex justify-between items-center p-2 rounded bg-gray-50">
            <span className="text-sm text-gray-600">💰 Available Balance</span>
            <span className="text-sm font-semibold text-gray-900">{availableBalanceSol.toFixed(3)} SOL</span>
          </div>

          {/* Trade Counts */}
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded bg-blue-50 text-center">
              <div className="text-xs text-gray-600">Total</div>
              <div className="text-sm font-bold text-blue-600">{totalTrades}</div>
            </div>
            <div className="p-2 rounded bg-green-50 text-center">
              <div className="text-xs text-gray-600">Buys</div>
              <div className="text-sm font-bold text-green-600">{buyCount}</div>
            </div>
            <div className="p-2 rounded bg-red-50 text-center">
              <div className="text-xs text-gray-600">Sells</div>
              <div className="text-sm font-bold text-red-600">{sellCount}</div>
            </div>
          </div>

          {/* Trading Volume (USD) */}
          <div className="p-2 rounded bg-gray-50">
            <div className="text-xs text-gray-600 mb-1">📊 Trading Volume (USD)</div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Bought:</span>
              <span className="font-semibold text-gray-900">
                {usdBought.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Sold:</span>
              <span className="font-semibold text-gray-900">
                {usdSold.toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="flex justify-between text-xs mt-1 pt-1 border-t border-gray-200">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-gray-900">
                {(usdBought + usdSold).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* Trading Volume (SOL) */}
          <div className="p-2 rounded bg-gray-50">
            <div className="text-xs text-gray-600 mb-1">🔵 Trading Volume (SOL)</div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Bought:</span>
              <span className="font-semibold text-gray-900">{solBought.toFixed(3)} SOL</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Sold:</span>
              <span className="font-semibold text-gray-900">{solSold.toFixed(3)} SOL</span>
            </div>
            <div className="flex justify-between text-xs mt-1 pt-1 border-t border-gray-200">
              <span className="text-gray-600">Total:</span>
              <span className="font-bold text-gray-900">{(solBought + solSold).toFixed(3)} SOL</span>
            </div>
          </div>

          {/* Realized Trading (Closed Positions) */}
          <div className="p-2 rounded bg-green-50 border border-green-200">
            <div className="text-xs text-gray-700 font-semibold mb-1">✅ Realized Trading</div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">USD Volume:</span>
              <span className="font-semibold text-gray-900">
                {(realizedUsdBought + realizedUsdSold).toLocaleString('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0 })}
              </span>
            </div>
          </div>

          {/* PNL Breakdown - Show all categories */}
          {pnlBreakdown && (
            <div className="p-2 rounded bg-purple-50 border border-purple-200">
              <div className="text-xs text-gray-700 font-semibold mb-2">📊 PNL Distribution</div>
              <div className="space-y-1">
                {pnlBreakdown.over500Percent > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">🚀 &gt;500%:</span>
                    <span className="font-bold text-green-600">{pnlBreakdown.over500Percent}</span>
                  </div>
                )}
                {pnlBreakdown.between200And500Percent > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">🎯 200-500%:</span>
                    <span className="font-semibold text-green-600">{pnlBreakdown.between200And500Percent}</span>
                  </div>
                )}
                {pnlBreakdown.between0And200Percent > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">📈 0-200%:</span>
                    <span className="font-semibold text-green-500">{pnlBreakdown.between0And200Percent}</span>
                  </div>
                )}
                {pnlBreakdown.between0AndNeg50Percent > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">📉 0-(-50)%:</span>
                    <span className="font-semibold text-red-500">{pnlBreakdown.between0AndNeg50Percent}</span>
                  </div>
                )}
                {pnlBreakdown.underNeg50Percent > 0 && (
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-600">❌ &lt;-50%:</span>
                    <span className="font-bold text-red-600">{pnlBreakdown.underNeg50Percent}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Recalculate Button */}
        <div className="mt-4 pt-4 border-t border-gray-200">
          <button
            onClick={handleRecalculate}
            disabled={isRecalculating}
            className={`w-full py-2 px-4 rounded-lg font-semibold text-sm transition-all ${
              isRecalculating
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg'
            }`}
          >
            {isRecalculating ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Updating...
              </span>
            ) : (
              <>🔄 Recalculate Stats</>
            )}
          </button>
          
          {/* Message Display */}
          {recalcMessage && (
            <div className={`mt-2 p-2 rounded text-xs text-center ${
              recalcMessage.startsWith('✅') 
                ? 'bg-green-100 text-green-800' 
                : 'bg-red-100 text-red-800'
            }`}>
              {recalcMessage}
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="mt-2">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-800 text-xs font-semibold">
            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
            Active Today
          </div>
        </div>
      </div>
    </div>
  );
}
