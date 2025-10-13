'use client';

import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export default function WalletButton() {
  return (
    <WalletMultiButton 
      className="
        !bg-green-500 
        hover:!bg-green-600 
        !rounded-lg 
        !px-2 sm:!px-4 
        !py-1.5 sm:!py-2 
        !text-xs sm:!text-sm 
        !font-medium 
        !transition-all
        !duration-200
        !border-none 
        !shadow-sm
        hover:!shadow-md
        !uppercase
        !tracking-wide
      " 
    />
  );
}