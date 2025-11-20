import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';

/**
 * PATCH /api/users/update-name
 * Update user's display name (requires JWT authentication)
 */
export async function PATCH(request: NextRequest) {
  try {
    await connectDB();

    // Verify JWT token
    const authHeader = request.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired token' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { name } = body;

    // Validate name field
    if (!name) {
      return NextResponse.json(
        { success: false, error: 'Name is required' },
        { status: 400 }
      );
    }

    // Validate name format: alphanumeric + dots + underscores, 1-50 characters
    const nameRegex = /^[a-zA-Z0-9._]+$/;
    if (!nameRegex.test(name)) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Name can only contain letters, numbers, dots (.) and underscores (_)' 
        },
        { status: 400 }
      );
    }

    if (name.length < 1 || name.length > 50) {
      return NextResponse.json(
        { success: false, error: 'Name must be between 1 and 50 characters' },
        { status: 400 }
      );
    }

    // Find and update user
    const user = await User.findOne({ wallet: payload.wallet.toLowerCase() });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Check name change limit (2 changes per 24 hours)
    const now = new Date();
    const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    // Filter recent name changes (within last 24 hours)
    const recentChanges = (user.nameChangeHistory || []).filter(
      (changeDate: Date) => changeDate > twentyFourHoursAgo
    );

    if (recentChanges.length >= 2) {
      // Find when user can change name again
      const oldestRecentChange = new Date(Math.min(...recentChanges.map((d: Date) => d.getTime())));
      const canChangeAgainAt = new Date(oldestRecentChange.getTime() + 24 * 60 * 60 * 1000);
      const hoursUntilNextChange = Math.ceil((canChangeAgainAt.getTime() - now.getTime()) / (1000 * 60 * 60));
      
      return NextResponse.json(
        { 
          success: false, 
          error: `Name change limit reached. You can only change your name 2 times per 24 hours. Try again in ${hoursUntilNextChange} hour(s).`,
          data: {
            changesUsed: recentChanges.length,
            maxChanges: 2,
            canChangeAgainAt: canChangeAgainAt.toISOString(),
          }
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Update name and add to history
    user.name = name.trim();
    user.nameChangeHistory = user.nameChangeHistory || [];
    user.nameChangeHistory.push(now);
    
    // Keep only last 10 changes in history (cleanup)
    if (user.nameChangeHistory.length > 10) {
      user.nameChangeHistory = user.nameChangeHistory.slice(-10);
    }
    
    await user.save();

    console.log(`✅ Updated name for user ${user.wallet}: "${name}" (${recentChanges.length + 1}/2 changes in 24h)`);

    return NextResponse.json(
      {
        success: true,
        message: 'Name updated successfully',
        data: {
          id: user._id,
          wallet: user.wallet,
          walletOriginal: user.walletOriginal,
          name: user.name,
          avatar: user.avatar,
          changesRemaining: 2 - (recentChanges.length + 1),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error updating name:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update name' },
      { status: 500 }
    );
  }
}
