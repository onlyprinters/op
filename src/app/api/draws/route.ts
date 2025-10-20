import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Draw from '@/models/Draw';
import { getCurrentSeasonId } from '@/lib/seasonUtils';

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const seasonIdParam = searchParams.get('seasonId');
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 20;

    const seasonId = seasonIdParam || getCurrentSeasonId();

    // Get all draws for the season, sorted by most recent first
    const draws = await Draw.find({
      seasonId,
      status: 'completed',
    })
      .sort({ drawTime: -1 })
      .limit(limit)
      .lean();

    // Format response
    const formattedDraws = draws.map((draw: any) => ({
      drawId: draw.drawId,
      drawTime: draw.drawTime,
      participants: draw.participants,
      winner: {
        id: draw.winnerId.toString(),
        wallet: draw.winnerWallet,
        name: draw.winnerName,
        rank: draw.winnerRank,
      },
      prizeAmount: draw.prizeAmount,
      totalPoolAtDraw: draw.totalPoolAtDraw,
      txSignature: draw.txSignature,
      txUrl: draw.txUrl,
    }));

    return NextResponse.json({
      success: true,
      data: {
        draws: formattedDraws,
        seasonId,
      },
    });
  } catch (error) {
    console.error('Error fetching draws:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to fetch draws',
      },
      { status: 500 }
    );
  }
}
