'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWallet } from '@solana/wallet-adapter-react';

export default function SecurityBadge() {
  const [showDetails, setShowDetails] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);
  const { connected } = useWallet();

  useEffect(() => {
    if (connected) {
      setShowDetails(false);
      setButtonRect(null);
      return;
    }

    // Find the wallet button and add hover listeners + badge
    const attachToButton = () => {
      const walletButton = document.querySelector('.wallet-adapter-button') as HTMLElement;
      if (!walletButton) return undefined;

      const buttonText = walletButton.textContent || '';
      
      // Check if wallet is connected (button shows address)
      const isConnected = !buttonText.toLowerCase().includes('select wallet');
      
      if (isConnected) {
        // For connected wallet: add verified badge and adjust padding
        if (!walletButton.querySelector('.verified-badge')) {
          // Keep original display but add padding for badge
          walletButton.style.position = 'relative';
          walletButton.style.paddingBottom = '16px';
          walletButton.style.display = 'flex';
          walletButton.style.alignItems = 'center';
          walletButton.style.justifyContent = 'center';
          
          const badge = document.createElement('div');
          badge.className = 'verified-badge';
          badge.innerHTML = '✅ Verified';
          badge.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 12px;
            background: linear-gradient(135deg, #ffffffff 0%, #d1fff1ff 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: green;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            border-radius: 0 0 8px 8px;
            pointer-events: none;
          `;
          walletButton.appendChild(badge);
        }
        return undefined;
      }
      
      // Only attach hover listeners if button says "Select Wallet"
      if (buttonText.toLowerCase().includes('select wallet')) {
        
        // Add verified badge if not already added
        if (!walletButton.querySelector('.verified-badge')) {
          const badge = document.createElement('div');
          badge.className = 'verified-badge';
          badge.innerHTML = '🔒 Verified';
          badge.style.cssText = `
            position: absolute;
            bottom: 0;
            left: 0;
            right: 0;
            height: 12px;
            background: linear-gradient(135deg, #ffffffff 0%, #d1fff1ff 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 8px;
            color: green;
            font-weight: 600;
            letter-spacing: 0.5px;
            text-transform: uppercase;
            border-radius: 0 0 8px 8px;
            pointer-events: none;
          `;
          
          // Make button position relative and add overflow hidden
          walletButton.style.position = 'relative';
          walletButton.style.overflow = 'hidden';
          walletButton.style.paddingBottom = '14px';
          walletButton.appendChild(badge);
        }

        const handleMouseEnter = () => {
          setButtonRect(walletButton.getBoundingClientRect());
          setShowDetails(true);
        };

        const handleMouseLeave = (e: MouseEvent) => {
          const relatedTarget = e.relatedTarget as HTMLElement;
          if (relatedTarget?.closest('.security-tooltip')) {
            return;
          }
          setShowDetails(false);
        };

        walletButton.addEventListener('mouseenter', handleMouseEnter);
        walletButton.addEventListener('mouseleave', handleMouseLeave);

        return () => {
          walletButton.removeEventListener('mouseenter', handleMouseEnter);
          walletButton.removeEventListener('mouseleave', handleMouseLeave);
          // Remove badge when cleaning up
          const existingBadge = walletButton.querySelector('.verified-badge');
          if (existingBadge) {
            existingBadge.remove();
          }
        };
      }
      
      return undefined;
    };

    let cleanup = attachToButton();

    // Only observe wallet button changes, not entire document
    const observer = new MutationObserver((mutations) => {
      // Ignore mutations caused by our own badge injection
      const isOurBadge = mutations.some(mutation => {
        if (mutation.type === 'childList') {
          return Array.from(mutation.addedNodes).some(node => 
            node instanceof HTMLElement && node.classList.contains('verified-badge')
          );
        }
        return false;
      });
      
      if (!isOurBadge) {
        if (cleanup) cleanup();
        cleanup = attachToButton();
      }
    });

    // Only observe the header, not entire body (optimization)
    const header = document.querySelector('header');
    if (header) {
      observer.observe(header, { 
        childList: true, 
        subtree: true 
      });
    }

    return () => {
      if (cleanup) cleanup();
      observer.disconnect();
    };
  }, [connected]);

  if (connected || !showDetails || !buttonRect) return null;

  return (
    <div
      className="security-tooltip fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border-2 border-green-500 dark:border-green-400 p-4"
      style={{
        top: `${buttonRect.bottom + window.scrollY + 8}px`,
        left: `${buttonRect.left + window.scrollX}px`
      }}
      onMouseEnter={() => setShowDetails(true)}
      onMouseLeave={() => setShowDetails(false)}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🔒</span>
          <h3 className="font-bold text-gray-900 dark:text-white text-base">
            Safe to Connect
          </h3>
        </div>
        <button
          onClick={() => setShowDetails(false)}
          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          ✕
        </button>
      </div>

      <div className="space-y-2.5 text-sm">
        <div className="flex items-start gap-2">
          <span className="text-green-500 mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Read-Only Access</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              We only read your wallet address. Cannot transfer funds.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-green-500 mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Signature Auth Only</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              Just proves you own the wallet. No transaction approval.
            </p>
          </div>
        </div>

        <div className="flex items-start gap-2">
          <span className="text-green-500 mt-0.5">✓</span>
          <div>
            <p className="font-semibold text-gray-900 dark:text-white">Open Source</p>
            <p className="text-gray-600 dark:text-gray-400 text-xs">
              All code is public and auditable on GitHub.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1.5">
            <span className="font-semibold text-red-500">We NEVER:</span>
          </p>
          <ul className="space-y-0.5 text-xs text-gray-600 dark:text-gray-400">
            <li>• Request your seed phrase</li>
            <li>• Ask to sign transactions</li>
            <li>• Request token approvals</li>
            <li>• Access your private keys</li>
          </ul>
        </div>

        <Link
          href="/security"
          onClick={() => setShowDetails(false)}
          className="block w-full text-center py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition-colors text-sm"
        >
          Learn More →
        </Link>
      </div>
    </div>
  );
}
