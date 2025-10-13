import { NextResponse } from 'next/server';
import { claimCreatorFees } from '@/lib/claimFees';

/**
 * POST /api/claim-fees
 * Claims creator fees from Pump.fun
 * 
 * Body (optional):
 * {
 *   "priorityFee": 0.000001  // Priority fee in SOL
 * }
 */
export async function POST(request: Request) {
  console.log('🎁 POST /api/claim-fees - Claiming creator fees');

  try {
    const body = await request.json().catch(() => ({}));
    const priorityFee = body.priorityFee || 0.000001;

    // Validate priority fee
    if (typeof priorityFee !== 'number' || priorityFee < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid priority fee' },
        { status: 400 }
      );
    }

    // Claim fees
    const result = await claimCreatorFees(priorityFee);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          signature: result.signature,
          explorerUrl: `https://solscan.io/tx/${result.signature}`,
          message: 'Creator fees claimed successfully',
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to claim fees' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in claim-fees endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/claim-fees
 * Claims creator fees from Pump.fun (with default priority fee)
 */
export async function GET() {
  console.log('🎁 GET /api/claim-fees - Claiming creator fees with default priority');

  try {
    // Use default priority fee of 0.000001 SOL
    const result = await claimCreatorFees(0.000001);

    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          signature: result.signature,
          explorerUrl: `https://solscan.io/tx/${result.signature}`,
          message: 'Creator fees claimed successfully',
        },
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to claim fees' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error claiming fees:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
