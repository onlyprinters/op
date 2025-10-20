import { NextRequest, NextResponse } from 'next/server';

/**
 * Verifies that the request contains valid API authentication
 * Used to protect internal/admin endpoints from unauthorized access
 * 
 * Usage:
 * const authResult = verifyApiAuth(request);
 * if (!authResult.authorized) {
 *   return authResult.response;
 * }
 */
export function verifyApiAuth(request: NextRequest): { 
  authorized: boolean; 
  response?: NextResponse 
} {
  const authHeader = request.headers.get('authorization');
  const apiSecret = process.env.API_SECRET;

  // Check if API_SECRET is configured
  if (!apiSecret) {
    console.error('❌ API_SECRET not configured in environment variables');
    return {
      authorized: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'API authentication not configured' 
        },
        { status: 500 }
      )
    };
  }

  // Check if authorization header is present
  if (!authHeader) {
    return {
      authorized: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Missing authorization header' 
        },
        { status: 401 }
      )
    };
  }

  // Verify Bearer token format
  const [type, token] = authHeader.split(' ');
  if (type !== 'Bearer' || !token) {
    return {
      authorized: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Invalid authorization format. Use: Bearer <token>' 
        },
        { status: 401 }
      )
    };
  }

  // Verify token matches API_SECRET
  if (token !== apiSecret) {
    console.warn('⚠️ Unauthorized API access attempt with invalid token');
    return {
      authorized: false,
      response: NextResponse.json(
        { 
          success: false, 
          error: 'Invalid API token' 
        },
        { status: 403 }
      )
    };
  }

  // All checks passed
  return { authorized: true };
}

/**
 * Alternative: Verify API secret from query parameter
 * Less secure but easier for testing
 * Only use this in development/staging environments
 */
export function verifyApiSecretFromQuery(request: NextRequest): { 
  authorized: boolean; 
  response?: NextResponse 
} {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  const apiSecret = process.env.API_SECRET;

  if (!apiSecret) {
    console.error('❌ API_SECRET not configured');
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'API authentication not configured' },
        { status: 500 }
      )
    };
  }

  if (!secret || secret !== apiSecret) {
    console.warn('⚠️ Unauthorized API access attempt');
    return {
      authorized: false,
      response: NextResponse.json(
        { success: false, error: 'Invalid or missing secret parameter' },
        { status: 403 }
      )
    };
  }

  return { authorized: true };
}
