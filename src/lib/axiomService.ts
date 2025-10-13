/**
 * Service for fetching wallet portfolio data from Axiom API
 * Used to update DailyTrader stats with real trading data
 */

import axios from 'axios';
import { readFileSync } from 'fs';
import path from 'path';

interface AxiomPortfolioData {
  wallet: string;
  
  // Balance Stats
  availableBalanceSol: number;
  
  // Performance Metrics - One Day
  totalPnl: number;
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
  
  error?: string;
}

interface DailyTraderUpdateData {
  // Balance
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
}

/**
 * Get portfolio data for a single wallet from Axiom API
 * @param walletAddress - Wallet address (normalized, lowercase for DB)
 * @param originalWallet - Original wallet address with proper case sensitivity for API call
 */
export async function getWalletPortfolio(
  walletAddress: string, 
  originalWallet?: string
): Promise<AxiomPortfolioData | null> {
  if (!walletAddress) {
    console.warn('No wallet address provided');
    return null;
  }

  // Use original wallet if provided (for API call), otherwise use normalized
  const walletForApi = originalWallet || walletAddress;

  try {
    let cookieString = '';

    // Load cookies from file
    try {
      const cookiesPath = path.join(process.cwd(), 'cookies', 'axiom_cookies.json');
      const cookiesData = readFileSync(cookiesPath, 'utf8');
      const cookies = JSON.parse(cookiesData);

      if (cookies && Array.isArray(cookies) && cookies.length > 0) {
        cookieString = cookies
          .filter((cookie: { name: string }) => 
            cookie.name === 'auth-refresh-token' || cookie.name === 'auth-access-token'
          )
          .map((cookie: { name: string; value: string }) => `${cookie.name}=${cookie.value}`)
          .join('; ');
      }
    } catch (err) {
      console.error('Failed to load cookies from file:', err);
      return null;
    }

    if (!cookieString) {
      console.error('No valid cookies found');
      return null;
    }

    console.log(`Fetching portfolio for wallet: ${walletForApi}`);

    const response = await axios.post('https://api9.axiom.trade/portfolio-v5', {
      walletAddressRaw: walletForApi, // Use original case-sensitive wallet
      isOtherWallet: true,
      totalSolBalance: 0,
      tokenAddressToAmountMap: {},
      timeOffset: -120
    }, {
      headers: {
        'Cookie': cookieString,
        'Content-Type': 'application/json',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36'
      },
      timeout: 10000 // 10 second timeout
    });

    if (response.data && response.data.performanceMetrics && response.data.performanceMetrics.oneDay) {
      const oneDayMetrics = response.data.performanceMetrics.oneDay;
      const balanceStats = response.data.balanceStats;
      
      return {
        wallet: walletAddress,
        
        // Balance Stats
        availableBalanceSol: balanceStats?.availableBalanceSol || 0,
        
        // Performance Metrics - One Day
        totalPnl: oneDayMetrics.totalPnl || 0,
        buyCount: oneDayMetrics.buyCount || 0,
        sellCount: oneDayMetrics.sellCount || 0,
        
        // PNL Breakdown
        pnlBreakdown: {
          over500Percent: oneDayMetrics.pnlBreakdown?.over500Percent || 0,
          between200And500Percent: oneDayMetrics.pnlBreakdown?.between200And500Percent || 0,
          between0And200Percent: oneDayMetrics.pnlBreakdown?.between0And200Percent || 0,
          between0AndNeg50Percent: oneDayMetrics.pnlBreakdown?.between0AndNeg50Percent || 0,
          underNeg50Percent: oneDayMetrics.pnlBreakdown?.underNeg50Percent || 0,
        },
        
        // USD Metrics
        usdBought: oneDayMetrics.usdBought || 0,
        usdSold: oneDayMetrics.usdSold || 0,
        
        // SOL Metrics
        solBought: oneDayMetrics.solBought || 0,
        solSold: oneDayMetrics.solSold || 0,
        
        // Realized PNL
        realizedSolPnl: oneDayMetrics.realizedSolPnl || 0,
        realizedSolBought: oneDayMetrics.realizedSolBought || 0,
        realizedSolSold: oneDayMetrics.realizedSolSold || 0,
        realizedUsdPnl: oneDayMetrics.realizedUsdPnl || 0,
        realizedUsdBought: oneDayMetrics.realizedUsdBought || 0,
        realizedUsdSold: oneDayMetrics.realizedUsdSold || 0,
      };
    }

    console.warn(`No portfolio data for wallet: ${walletAddress}`);
    return null;

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error(`Axios error fetching portfolio for ${walletAddress}:`, error.message);
    } else if (error instanceof Error) {
      console.error(`Error fetching portfolio for ${walletAddress}:`, error.message);
    } else {
      console.error(`Unknown error fetching portfolio for ${walletAddress}`);
    }
    return null;
  }
}

/**
 * Transform Axiom portfolio data to DailyTrader update format
 */
export function transformToTraderData(
  portfolioData: AxiomPortfolioData
): DailyTraderUpdateData {
  return {
    // Balance
    availableBalanceSol: portfolioData.availableBalanceSol,
    
    // Overall Performance
    totalPnl: portfolioData.totalPnl,
    totalTrades: portfolioData.buyCount + portfolioData.sellCount,
    
    // Trade Counts
    buyCount: portfolioData.buyCount,
    sellCount: portfolioData.sellCount,
    
    // PNL Breakdown
    pnlBreakdown: portfolioData.pnlBreakdown,
    
    // USD Metrics
    usdBought: portfolioData.usdBought,
    usdSold: portfolioData.usdSold,
    
    // SOL Metrics
    solBought: portfolioData.solBought,
    solSold: portfolioData.solSold,
    
    // Realized PNL
    realizedSolPnl: portfolioData.realizedSolPnl,
    realizedSolBought: portfolioData.realizedSolBought,
    realizedSolSold: portfolioData.realizedSolSold,
    realizedUsdPnl: portfolioData.realizedUsdPnl,
    realizedUsdBought: portfolioData.realizedUsdBought,
    realizedUsdSold: portfolioData.realizedUsdSold,
  };
}

/**
 * Batch process multiple wallets with rate limiting
 * @param wallets - Array of objects with wallet (normalized) and originalWallet (case-sensitive)
 * @param delayMs - Delay between requests in milliseconds
 */
export async function getMultipleWalletPortfolios(
  wallets: Array<{ wallet: string; originalWallet?: string }>,
  delayMs: number = 200
): Promise<AxiomPortfolioData[]> {
  const results: AxiomPortfolioData[] = [];

  for (const { wallet, originalWallet } of wallets) {
    const data = await getWalletPortfolio(wallet, originalWallet);
    if (data) {
      results.push(data);
    }
    
    // Rate limiting delay
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }

  return results;
}
