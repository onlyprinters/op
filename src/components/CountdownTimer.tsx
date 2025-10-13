'use client';

import { useState, useEffect } from 'react';

interface CountdownTimerProps {
  rewardPool: number; // SOL amount
}

export default function CountdownTimer({ rewardPool }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      
      // Get tomorrow's 00:00 UTC (midnight)
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

        {/* Creator Rewards */}
        <div className="flex flex-col items-center">
          <h3 className="text-sm font-medium text-gray-600 mb-3 uppercase tracking-wider">
            Rewards from Fees
          </h3>
          <div className="flex items-center gap-3">
            <span className="text-4xl font-bold text-gray-900">
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
          <p className="text-xs text-gray-500 mt-2">50% of daily creator rewards</p>
        </div>
      </div>
    </div>
  );
}