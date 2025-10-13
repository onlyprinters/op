import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
  wallet: string;
  walletOriginal: string; // Original case-sensitive wallet address for Solana operations
  name: string;
  avatar: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    wallet: {
      type: String,
      required: [true, 'Wallet address is required'],
      unique: true,
      trim: true,
      lowercase: true,
    },
    walletOriginal: {
      type: String,
      required: [true, 'Original wallet address is required'],
      trim: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot be more than 50 characters'],
    },
    avatar: {
      type: String,
      required: true,
      default: function() {
        // Randomly select from 1.png to 20.png
        const randomNum = Math.floor(Math.random() * 20) + 1;
        return `/${randomNum}.png`;
      },
    },
  },
  {
    timestamps: true,
  }
);

// Note: wallet already has unique index from "unique: true" in schema definition
// No need for additional index here

// Prevent model recompilation in development
const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
