'use client';

import { useState } from 'react';

export default function Footer() {
  const [copied, setCopied] = useState(false);
  const CA = process.env.NEXT_PUBLIC_OP_TOKEN_MINT || 'xxxxxxxxxxxxxxxxxxxpump';
  const telegramUrl = process.env.NEXT_PUBLIC_TELEGRAM_URL || 'https://t.me/onlyprinters';
  const xUrl = process.env.NEXT_PUBLIC_X_URL || 'https://x.com/onlyprinters_';
  const githubUrl = process.env.NEXT_PUBLIC_GITHUB_URL || 'https://github.com/onlyprinters/op';

  const copyCA = async () => {
    try {
      await navigator.clipboard.writeText(CA);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <footer className="fixed bottom-0 left-0 right-0 bg-green-500/10 backdrop-blur-sm border-t border-green-200/30 z-50">
      <div className="max-w-7xl mx-auto px-4 py-1">
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-4 text-xs">
          {/* Motivational Tagline */}
          <div className="hidden sm:block">
            <p className="text-gray-600 font-medium">
              💎 Survive, print, repeat
            </p>
          </div>

          {/* Right Side: Social Links + CA */}
          <div className="flex items-center gap-2 sm:gap-3 ml-auto">
            {/* Social Links */}
            <div className="flex items-center gap-1.5">
              {/* Telegram */}
              <a
                href={telegramUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-white/50 hover:bg-blue-500 text-gray-600 hover:text-white transition-all duration-200 group"
                title="Join our Telegram"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.562 8.161c-.18 1.897-.962 6.502-1.359 8.627-.168.9-.5 1.201-.82 1.23-.697.064-1.226-.461-1.901-.903-1.056-.692-1.653-1.123-2.678-1.799-1.185-.781-.417-1.21.258-1.911.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.139-5.062 3.345-.479.329-.913.489-1.302.481-.428-.009-1.252-.241-1.865-.44-.752-.244-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.831-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635.099-.002.321.023.465.14.121.098.155.232.171.326.016.094.037.308.02.476z"/>
                </svg>
              </a>

              {/* X (Twitter) */}
              <a
                href={xUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-white/50 hover:bg-black text-gray-600 hover:text-white transition-all duration-200 group"
                title="Follow us on X"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>

              {/* GitHub */}
              <a
                href={githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1.5 rounded-lg bg-white/50 hover:bg-gray-800 text-gray-600 hover:text-white transition-all duration-200 group"
                title="View on GitHub"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
              </a>
            </div>

            {/* Divider */}
            <div className="hidden sm:block w-px h-4 bg-gray-300"></div>

            {/* Contract Address */}
            <button
              onClick={copyCA}
              className="text-gray-700 font-mono font-medium hover:text-green-600 transition-colors flex items-center gap-1.5 group"
              title="Click to copy CA"
            >
              <span className="text-gray-500 text-[10px] uppercase tracking-wider hidden sm:inline">CA:</span>
              <span className="truncate max-w-[120px] sm:max-w-none">{CA}</span>
              {copied ? (
                <svg className="w-3 h-3 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-3 h-3 text-gray-400 group-hover:text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
