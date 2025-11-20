'use client';

import { useState, useEffect } from 'react';
import WinnersModal from './WinnersModal';

interface CountdownTimerProps {
  rewardPool: number; // SOL amount - full creator rewards pool
}

export default function CountdownTimer({ rewardPool }: CountdownTimerProps) {
  const [showWinnersModal, setShowWinnersModal] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  
  const [nextDrawTime, setNextDrawTime] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Get tomorrow's 00:00 UTC (midnight) - daily reset
      const tomorrowMidnight = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1, // Next day
        0, 0, 0, 0 // Midnight
      ));
      
      const difference = tomorrowMidnight.getTime() - now.getTime();
      
      if (difference > 0) {
        const hours = Math.floor(difference / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);
        
        setTimeLeft({ hours, minutes, seconds });
      } else {
        // Season just ended, reset to 24 hours
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
      }
      
      // Calculate next 2-hour draw time
      const currentHour = now.getUTCHours();
      const nextDrawHour = Math.ceil((currentHour + 1) / 2) * 2; // Next even hour
      const nextDraw = new Date(Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate(),
        nextDrawHour,
        0, 0, 0
      ));
      
      // If next draw is past today, move to tomorrow
      if (nextDraw.getTime() <= now.getTime()) {
        nextDraw.setUTCDate(nextDraw.getUTCDate() + 1);
      }
      
      const drawDifference = nextDraw.getTime() - now.getTime();
      const drawHours = Math.floor(drawDifference / (1000 * 60 * 60));
      const drawMinutes = Math.floor((drawDifference % (1000 * 60 * 60)) / (1000 * 60));
      const drawSeconds = Math.floor((drawDifference % (1000 * 60)) / 1000);
      
      setNextDrawTime({ hours: drawHours, minutes: drawMinutes, seconds: drawSeconds });
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatNumber = (num: number) => String(num).padStart(2, '0');

  return (
    <div className="bg-white rounded-lg shadow-md border border-green-200 p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center justify-center gap-8">
        {/* Countdown Timer */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wider">
            Daily Reset In
          </h3>
          <div className="flex gap-2">
            <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 min-w-[70px]">
              <span className="text-3xl font-bold text-green-600">
                {formatNumber(timeLeft.hours)}
              </span>
              <span className="text-xs text-gray-600 mt-1">Hours</span>
            </div>
            <div className="flex items-center text-2xl text-green-600 font-bold">:</div>
            <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 min-w-[70px]">
              <span className="text-3xl font-bold text-green-600">
                {formatNumber(timeLeft.minutes)}
              </span>
              <span className="text-xs text-gray-600 mt-1">Minutes</span>
            </div>
            <div className="flex items-center text-2xl text-green-600 font-bold">:</div>
            <div className="flex flex-col items-center bg-green-50 rounded-lg p-3 min-w-[70px]">
              <span className="text-3xl font-bold text-green-600">
                {formatNumber(timeLeft.seconds)}
              </span>
              <span className="text-xs text-gray-600 mt-1">Seconds</span>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="hidden md:block w-px h-20 bg-gray-300"></div>
        <div className="md:hidden w-full h-px bg-gray-300"></div>

        {/* Total Creator Rewards Pool */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wider">
            Total Creator Rewards
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-green-600">
              {rewardPool.toFixed(3)}
            </span>
            <svg
              className="w-8 h-8 text-green-500"
              viewBox="0 0 397.7 311.7"
              fill="currentColor"
            >
              <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
              <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
              <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
            </svg>
          </div>
          <div className="text-center mt-3 space-y-1">
            <div className="flex items-center gap-2 justify-center">
              <span className="text-xs font-semibold text-green-600">🎲 Next Draw:</span>
              <span className="text-xs font-bold text-gray-900">
                {formatNumber(nextDrawTime.hours)}:{formatNumber(nextDrawTime.minutes)}:{formatNumber(nextDrawTime.seconds)}
              </span>
            </div>
            <p className="text-xs text-gray-600 leading-tight">
              Every 2 hours: Top 3 traders compete
            </p>
            <div className="flex items-center gap-2 justify-center mt-2">
              <p className="text-xs font-semibold text-green-600">
                Next Prize:
              </p>
              <div className="flex items-center gap-1">
                <span className="text-sm font-bold text-gray-900">
                  {(rewardPool * 0.1).toFixed(3)}
                </span>
                <svg
                  className="w-3 h-3 text-green-500"
                  viewBox="0 0 397.7 311.7"
                  fill="currentColor"
                >
                  <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1l62.7-62.7z" />
                  <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z" />
                  <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z" />
                </svg>
              </div>
              <span className="text-xs text-gray-500">(10% of pool)</span>
            </div>
            <button
              onClick={() => setShowWinnersModal(true)}
              className="mt-3 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-2 mx-auto"
            >
              <span>🏆</span>
              View Winners
            </button>
          </div>
        </div>
      </div>

      {/* Winners Modal */}
      <WinnersModal
        isOpen={showWinnersModal}
        onClose={() => setShowWinnersModal(false)}
      />
    </div>
  );
}