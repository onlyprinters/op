'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';

interface DrawParticipant {
  userId: string;
  wallet: string;
  walletOriginal: string;
  name: string;
  avatar: string;
  rank: number;
  realizedPnl: number;
  winChance: number;
}

interface DrawData {
  drawId: string;
  drawTime: string;
  participants: DrawParticipant[];
  winner: {
    id: string;
    wallet: string;
    name: string;
    rank: number;
  };
  prizeAmount: number;
  totalPoolAtDraw: number;
  txSignature: string;
  txUrl: string;
}

interface WinnersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WinnersModal({ isOpen, onClose }: WinnersModalProps) {
  const [draws, setDraws] = useState<DrawData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDraws, setExpandedDraws] = useState<Set<string>>(new Set());
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  useEffect(() => {
    if (isOpen) {
      fetchDraws();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, selectedDate]);

  const fetchDraws = async () => {
    try {
      setLoading(true);
      setError(null);

      // Format date as YYYY-MM-DD for seasonId
      const seasonId = selectedDate.toISOString().split('T')[0];
      
      const response = await fetch(`/api/draws?seasonId=${seasonId}&limit=50`);
      const result = await response.json();

      if (result.success) {
        setDraws(result.data.draws);
      } else {
        setError(result.error || 'Failed to fetch draws');
      }
    } catch (err) {
      console.error('Error fetching draws:', err);
      setError('Failed to load winners');
    } finally {
      setLoading(false);
    }
  };

  const toggleDrawExpanded = (drawId: string) => {
    setExpandedDraws(prev => {
      const newSet = new Set(prev);
      if (newSet.has(drawId)) {
        newSet.delete(drawId);
      } else {
        newSet.add(drawId);
      }
      return newSet;
    });
  };

  const changeDate = (days: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + days);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  // Calculate if selected date is today - memoized to avoid issues with date comparison
  const isToday = useMemo(() => {
    const today = new Date();
    const selectedDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`;
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
    return selectedDateStr === todayStr;
  }, [selectedDate]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-500 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                🏆 Prize Draw Winners
              </h2>
              <p className="text-green-100 text-sm mt-1">
                History of all prize draws and winners
              </p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-green-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3">
            <button
              onClick={() => changeDate(-1)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="Previous day"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>

            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-white font-bold text-lg">
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
                <p className="text-green-100 text-xs">
                  {draws.length} draw{draws.length !== 1 ? 's' : ''} on this day
                  {isToday && ' • Current'}
                </p>
              </div>
              <button
                onClick={goToToday}
                disabled={isToday}
                className={`px-3 py-1 text-white text-sm font-semibold rounded-full transition-all ${
                  isToday 
                    ? 'bg-white/10 cursor-not-allowed opacity-50' 
                    : 'bg-white/20 hover:bg-white/30 hover:scale-105 active:scale-95'
                }`}
                title={isToday ? "You're viewing today" : "Jump to today's draws"}
              >
                {isToday ? '✓ Today' : 'Today'}
              </button>
            </div>

            <button
              onClick={() => changeDate(1)}
              disabled={isToday}
              className={`p-2 rounded-lg transition-colors ${
                isToday 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-white/20'
              }`}
              title="Next day"
            >
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 font-semibold">{error}</p>
            </div>
          ) : draws.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 text-lg">No draws on this day</p>
              <p className="text-gray-500 text-sm mt-2">Try selecting a different date</p>
            </div>
          ) : (
            <div className="space-y-4">
              {draws.map((draw) => {
                const isExpanded = expandedDraws.has(draw.drawId);
                return (
                  <div 
                    key={draw.drawId} 
                    className="bg-gradient-to-br from-gray-50 to-white rounded-lg border-2 border-gray-200 hover:border-green-300 transition-all shadow-sm hover:shadow-md"
                  >
                    {/* Draw Summary (Always Visible) */}
                    <div 
                      className="p-4 cursor-pointer"
                      onClick={() => toggleDrawExpanded(draw.drawId)}
                    >
                      <div className="flex items-center justify-between gap-4">
                        {/* Left: Time & ID */}
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-2 rounded-lg">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-gray-900">
                              Draw #{draw.drawId}
                            </h3>
                            <p className="text-xs text-gray-600">
                              {new Date(draw.drawTime).toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </p>
                          </div>
                        </div>

                        {/* Center: Winner Info */}
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="text-lg">🏆</span>
                          <div className="flex items-center gap-2 min-w-0">
                            <Image
                              src={draw.participants.find(p => p.userId === draw.winner.id)?.avatar || '/logo.png'}
                              alt={draw.winner.name}
                              width={32}
                              height={32}
                              className="rounded-full flex-shrink-0"
                            />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate text-sm">
                                {draw.winner.name}
                              </p>
                              <p className="text-xs text-gray-500">
                                Rank #{draw.winner.rank}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Right: Prize & Expand */}
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {draw.prizeAmount.toFixed(3)} SOL
                            </p>
                            <p className="text-xs text-gray-500">
                              {draw.participants.length} participants
                            </p>
                          </div>
                          <svg 
                            className={`w-5 h-5 text-gray-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </div>
                      </div>
                    </div>

                    {/* Expanded Details */}
                    {isExpanded && (
                      <div className="border-t border-gray-200 p-4 bg-white">
                        {/* Stats Row */}
                        <div className="grid grid-cols-3 gap-4 mb-4">
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <p className="text-xs text-gray-600">Total Pool</p>
                            <p className="text-sm font-bold text-gray-900">{draw.totalPoolAtDraw.toFixed(3)} SOL</p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <p className="text-xs text-gray-600">Prize Share</p>
                            <p className="text-sm font-bold text-green-600">
                              {((draw.prizeAmount / draw.totalPoolAtDraw) * 100).toFixed(1)}%
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg text-center">
                            <p className="text-xs text-gray-600">Participants</p>
                            <p className="text-sm font-bold text-gray-900">{draw.participants.length}</p>
                          </div>
                        </div>

                        {/* Participants Table */}
                        <div className="overflow-x-auto mb-3">
                          <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                              <tr>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Rank</th>
                                <th className="px-3 py-2 text-left text-xs font-semibold text-gray-700">Trader</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">PNL</th>
                                <th className="px-3 py-2 text-right text-xs font-semibold text-gray-700">Win %</th>
                                <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700">Result</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                              {draw.participants.map((participant) => {
                                const isWinner = participant.userId === draw.winner.id;
                                return (
                                  <tr key={participant.userId} className={isWinner ? 'bg-green-50' : 'bg-white'}>
                                    <td className="px-3 py-2">
                                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                                        participant.rank === 1 ? 'bg-yellow-400 text-yellow-900' :
                                        participant.rank === 2 ? 'bg-gray-300 text-gray-800' :
                                        participant.rank === 3 ? 'bg-orange-400 text-orange-900' :
                                        'bg-gray-200 text-gray-700'
                                      }`}>
                                        {participant.rank}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2">
                                      <div className="flex items-center gap-2">
                                        <Image
                                          src={participant.avatar}
                                          alt={participant.name}
                                          width={24}
                                          height={24}
                                          className="rounded-full"
                                        />
                                        <span className="font-medium text-gray-900 text-xs">{participant.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <span className={`font-semibold text-xs ${participant.realizedPnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                        {participant.realizedPnl >= 0 ? '+' : ''}{participant.realizedPnl.toLocaleString('en-US', {
                                          style: 'currency',
                                          currency: 'USD',
                                          minimumFractionDigits: 0,
                                        })}
                                      </span>
                                    </td>
                                    <td className="px-3 py-2 text-right">
                                      <span className="text-xs font-semibold text-gray-700">{participant.winChance}%</span>
                                    </td>
                                    <td className="px-3 py-2 text-center">
                                      {isWinner && (
                                        <span className="inline-flex items-center gap-1 bg-green-600 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                          🏆 WIN
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Transaction Link */}
                        <div className="flex items-center justify-between pt-3 border-t border-gray-200">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>TX:</span>
                            <code className="text-xs bg-gray-100 px-2 py-0.5 rounded font-mono">
                              {draw.txSignature.substring(0, 8)}...{draw.txSignature.substring(draw.txSignature.length - 8)}
                            </code>
                          </div>
                          <a
                            href={draw.txUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-green-600 hover:text-green-700 font-semibold text-xs flex items-center gap-1"
                          >
                            View on Solscan
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
