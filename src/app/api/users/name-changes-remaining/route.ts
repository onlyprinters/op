import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { verifyToken, extractTokenFromHeader } from '@/lib/jwt';

/**
 * GET /api/users/name-changes-remaining
 * Check how many name changes are remaining (requires JWT authentication)
 */
export async function GET(request: NextRequest) {
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

    // Find user
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

    const changesRemaining = Math.max(0, 2 - recentChanges.length);

    return NextResponse.json(
      {
        success: true,
        data: {
          changesUsed: recentChanges.length,
          changesRemaining,
          maxChanges: 2,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Error checking name changes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check name changes' },
      { status: 500 }
    );
  }
}
