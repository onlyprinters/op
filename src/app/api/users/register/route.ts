import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifySignature, isSignatureTimestampValid } from '@/lib/signMessage';
import { generateToken } from '@/lib/jwt';

export async function POST(request: NextRequest) {
  try {
    // Connect to MongoDB
    await connectDB();

    // Parse request body
    const body = await request.json();
    const { wallet, name, message, signature } = body;

    // Validate required fields
    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!message || !signature) {
      return NextResponse.json(
        { success: false, error: 'Message and signature are required for verification' },
        { status: 400 }
      );
    }

    // Verify signature timestamp (must be within 5 minutes)
    if (!isSignatureTimestampValid(message)) {
      return NextResponse.json(
        { success: false, error: 'Signature has expired. Please try again.' },
        { status: 401 }
      );
    }

    // Verify wallet ownership through signature
    const isValidSignature = verifySignature(message, signature, wallet);
    if (!isValidSignature) {
      return NextResponse.json(
        { success: false, error: 'Invalid signature. Wallet verification failed.' },
        { status: 401 }
      );
    }

    // Check if user with this wallet already exists
    const existingUser = await User.findOne({ wallet: wallet.toLowerCase() });
    if (existingUser) {
      // User exists, generate JWT token (login)
      const token = generateToken(String(existingUser._id), existingUser.wallet);
      
      return NextResponse.json(
        {
          success: true,
          data: {
            id: existingUser._id,
            wallet: existingUser.wallet,
            walletOriginal: existingUser.walletOriginal,
            name: existingUser.name,
            avatar: existingUser.avatar,
            createdAt: existingUser.createdAt,
            updatedAt: existingUser.updatedAt,
          },
          token, // JWT token for session
        },
        { status: 200 }
      );
    }

    // Create new user (avatar will be randomly assigned by default function)
    const user = await User.create({
      wallet: wallet.toLowerCase(),
      walletOriginal: wallet, // Store original case-sensitive format
      name,
    });

    // Generate JWT token for new user
    const token = generateToken(String(user._id), user.wallet);

    return NextResponse.json(
      {
        success: true,
        data: {
          id: user._id,
          wallet: user.wallet,
          walletOriginal: user.walletOriginal,
          name: user.name,
          avatar: user.avatar,
          createdAt: user.createdAt,
        },
        token, // JWT token for session
      },
      { status: 201 }
    );
  } catch (error: unknown) {
    console.error('Error registering user:', error);

    // Handle MongoDB duplicate key error
    if (error && typeof error === 'object' && 'code' in error && error.code === 11000) {
      return NextResponse.json(
        { success: false, error: 'User with this wallet already exists' },
        { status: 409 }
      );
    }

    // Handle validation errors
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ValidationError') {
      const message = 'message' in error && typeof error.message === 'string' ? error.message : 'Validation error';
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch user by wallet
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const wallet = searchParams.get('wallet');

    if (!wallet) {
      return NextResponse.json(
        { success: false, error: 'Wallet address is required' },
        { status: 400 }
      );
    }

    const user = await User.findOne({ wallet: wallet.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user._id,
        wallet: user.wallet,
        walletOriginal: user.walletOriginal,
        name: user.name,
        avatar: user.avatar,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
