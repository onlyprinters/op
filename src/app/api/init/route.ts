/**
 * Server initialization endpoint
 * This initializes cron jobs and other server-side tasks
 * It's called automatically by middleware on first request
 */

import { NextResponse } from 'next/server';
import { initializeServer } from '@/lib/serverInit';

export async function GET() {
  try {
    initializeServer();
    
    return NextResponse.json({
      success: true,
      message: 'Server initialized successfully',
    });
  } catch (error) {
    console.error('Failed to initialize server:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to initialize server',
      },
      { status: 500 }
    );
  }
}
