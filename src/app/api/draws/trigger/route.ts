import { NextRequest, NextResponse } from 'next/server';
import { performDraw } from '@/lib/drawService';
import { verifyApiAuth } from '@/lib/apiAuth';

export async function POST(request: NextRequest) {
  // ⚠️ PROTECTED ENDPOINT - Requires authentication
  // This endpoint transfers SOL, so it MUST be protected
  const authResult = verifyApiAuth(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    console.log('🎲 [API] Manual draw triggered (authenticated)');
    
    const result = await performDraw();

    if (result.success) {
      return NextResponse.json({
        success: true,
        message: 'Prize draw completed successfully',
        data: {
          drawId: result.drawId,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Failed to perform draw',
        },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error performing draw:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to perform draw',
      },
      { status: 500 }
    );
  }
}
