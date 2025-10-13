import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDailyTrader extends Document {
  userId: mongoose.Types.ObjectId;
  wallet: string;
  seasonId: string; // Season identifier in format YYYY-MM-DD (UTC date, resets at midnight 00:00 UTC)
  tokenBalance: number; // Balance at time of joining
  
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const DailyTraderSchema = new Schema<IDailyTrader>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    wallet: {
      type: String,
      required: [true, 'Wallet address is required'],
      trim: true,
      lowercase: true,
    },
    seasonId: {
      type: String,
      required: [true, 'Season ID is required'],
      index: true,
    },
    tokenBalance: {
      type: Number,
      required: [true, 'Token balance is required'],
      min: [0, 'Token balance cannot be negative'],
    },
    
    // Balance Stats
    availableBalanceSol: {
      type: Number,
      default: 0,
    },
    
    // Overall Performance
    totalPnl: {
      type: Number,
      default: 0,
    },
    totalTrades: {
      type: Number,
      default: 0,
      min: [0, 'Total trades cannot be negative'],
    },
    
    // Trade Counts
    buyCount: {
      type: Number,
      default: 0,
      min: [0, 'Buy count cannot be negative'],
    },
    sellCount: {
      type: Number,
      default: 0,
      min: [0, 'Sell count cannot be negative'],
    },
    
    // PNL Breakdown
    pnlBreakdown: {
      over500Percent: {
        type: Number,
        default: 0,
      },
      between200And500Percent: {
        type: Number,
        default: 0,
      },
      between0And200Percent: {
        type: Number,
        default: 0,
      },
      between0AndNeg50Percent: {
        type: Number,
        default: 0,
      },
      underNeg50Percent: {
        type: Number,
        default: 0,
      },
    },
    
    // USD Metrics
    usdBought: {
      type: Number,
      default: 0,
    },
    usdSold: {
      type: Number,
      default: 0,
    },
    
    // SOL Metrics
    solBought: {
      type: Number,
      default: 0,
    },
    solSold: {
      type: Number,
      default: 0,
    },
    
    // Realized PNL
    realizedSolPnl: {
      type: Number,
      default: 0,
    },
    realizedSolBought: {
      type: Number,
      default: 0,
    },
    realizedSolSold: {
      type: Number,
      default: 0,
    },
    realizedUsdPnl: {
      type: Number,
      default: 0,
    },
    realizedUsdBought: {
      type: Number,
      default: 0,
    },
    realizedUsdSold: {
      type: Number,
      default: 0,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
DailyTraderSchema.index({ seasonId: 1 }); // Query by season
DailyTraderSchema.index({ userId: 1, seasonId: 1 }); // Check if user joined specific season
DailyTraderSchema.index({ seasonId: 1, totalPnl: -1 }); // Alternative: sorting by total PNL
DailyTraderSchema.index({ seasonId: 1, realizedUsdPnl: -1 }); // PRIMARY: Leaderboard ranking by realized USD PNL (one day)
DailyTraderSchema.index({ isActive: 1, seasonId: 1 }); // Active traders per season

// Prevent model recompilation in development
const DailyTrader: Model<IDailyTrader> = 
  mongoose.models.DailyTrader || mongoose.model<IDailyTrader>('DailyTrader', DailyTraderSchema);

export default DailyTrader;
