import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IDrawParticipant {
  userId: mongoose.Types.ObjectId;
  wallet: string;
  walletOriginal: string;
  name: string;
  avatar: string;
  rank: number; // 1, 2, or 3
  realizedPnl: number;
  winChance: number; // 40, 35, or 25
}

export interface IDraw extends Document {
  drawId: string; // Format: YYYY-MM-DD-HH (e.g., "2025-10-14-14")
  seasonId: string; // Format: YYYY-MM-DD
  drawTime: Date; // When the draw occurred
  participants: IDrawParticipant[]; // Top 3 traders
  winnerId: mongoose.Types.ObjectId;
  winnerWallet: string;
  winnerName: string;
  winnerRank: number; // 1, 2, or 3
  prizeAmount: number; // SOL amount (10% of creator rewards)
  totalPoolAtDraw: number; // Total creator rewards pool at time of draw
  txSignature: string; // Solana transaction signature
  txUrl: string; // Solscan URL
  status: 'pending' | 'completed' | 'failed';
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DrawParticipantSchema = new Schema<IDrawParticipant>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  wallet: {
    type: String,
    required: true,
  },
  walletOriginal: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  avatar: {
    type: String,
    required: true,
  },
  rank: {
    type: Number,
    required: true,
    enum: [1, 2, 3],
  },
  realizedPnl: {
    type: Number,
    required: true,
  },
  winChance: {
    type: Number,
    required: true,
    enum: [40, 35, 25],
  },
}, { _id: false });

const DrawSchema = new Schema<IDraw>(
  {
    drawId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    seasonId: {
      type: String,
      required: true,
      index: true,
    },
    drawTime: {
      type: Date,
      required: true,
      index: true,
    },
    participants: {
      type: [DrawParticipantSchema],
      required: true,
      validate: {
        validator: function(v: IDrawParticipant[]) {
          return v.length === 3;
        },
        message: 'Must have exactly 3 participants',
      },
    },
    winnerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    winnerWallet: {
      type: String,
      required: true,
    },
    winnerName: {
      type: String,
      required: true,
    },
    winnerRank: {
      type: Number,
      required: true,
      enum: [1, 2, 3],
    },
    prizeAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    totalPoolAtDraw: {
      type: Number,
      required: true,
      min: 0,
    },
    txSignature: {
      type: String,
      required: true,
    },
    txUrl: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending',
    },
    errorMessage: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
DrawSchema.index({ seasonId: 1, drawTime: -1 });
DrawSchema.index({ winnerId: 1, drawTime: -1 });

const Draw: Model<IDraw> = mongoose.models.Draw || mongoose.model<IDraw>('Draw', DrawSchema);

export default Draw;
