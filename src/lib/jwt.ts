import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || process.env.API_SECRET || 'fallback-secret-change-this';
const JWT_EXPIRES_IN = '7d'; // Token valid for 7 days

export interface JWTPayload {
  userId: string;
  wallet: string;
  iat?: number;
  exp?: number;
}

/**
 * Generate JWT token for authenticated user
 */
export function generateToken(userId: string, wallet: string): string {
  return jwt.sign(
    { userId, wallet },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

/**
 * Verify and decode JWT token
 * Returns payload if valid, null if invalid/expired
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch {
    // Token invalid or expired
    return null;
  }
}

/**
 * Extract token from Authorization header
 * Supports "Bearer <token>" format
 */
export function extractTokenFromHeader(authHeader: string | null): string | null {
  if (!authHeader) return null;
  
  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  
  return authHeader;
}
