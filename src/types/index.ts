// Types for printer management application

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'user';
  department?: string;
  createdAt: Date;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  success: boolean;
}

export interface Trader {
  id: string;
  walletAddress: string;
  walletOriginal: string; // Original case-sensitive wallet address
  avatar: string;
  displayName: string; // Last 5 chars of wallet
  
  // Balance Stats
  availableBalanceSol: number;
  
  // Overall Performance
  totalPnl: number;
  totalTrades: number;
  
  // Trade Counts
  buyCount: number;
  sellCount: number;
  
  // PNL Breakdown
  pnlBreakdown: {
    over500Percent: number;
    between200And500Percent: number;
    between0And200Percent: number;
    between0AndNeg50Percent: number;
    underNeg50Percent: number;
  };
  
  // USD Metrics
  usdBought: number;
  usdSold: number;
  
  // SOL Metrics
  solBought: number;
  solSold: number;
  
  // Realized PNL
  realizedSolPnl: number;
  realizedSolBought: number;
  realizedSolSold: number;
  realizedUsdPnl: number;
  realizedUsdBought: number;
  realizedUsdSold: number;
  
  joinedAt: Date;
  soldPrint?: boolean; // True if token balance dropped below required
}