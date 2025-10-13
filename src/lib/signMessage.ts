import nacl from 'tweetnacl';
import bs58 from 'bs58';

/**
 * Generate a message to be signed by the wallet
 */
export function generateSignMessage(walletAddress: string): string {
  const timestamp = Date.now();
  const message = `Sign this message to verify wallet ownership for onlyPrinters\n\nWallet: ${walletAddress}\nTimestamp: ${timestamp}`;
  return message;
}

/**
 * Verify wallet signature (server-side)
 */
export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  try {
    const messageBytes = new TextEncoder().encode(message);
    const signatureBytes = bs58.decode(signature);
    const publicKeyBytes = bs58.decode(publicKey);

    const verified = nacl.sign.detached.verify(
      messageBytes,
      signatureBytes,
      publicKeyBytes
    );

    return verified;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Check if signature timestamp is recent (within 5 minutes)
 */
export function isSignatureTimestampValid(message: string): boolean {
  try {
    const timestampMatch = message.match(/Timestamp: (\d+)/);
    if (!timestampMatch) return false;

    const timestamp = parseInt(timestampMatch[1], 10);
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return now - timestamp < fiveMinutes;
  } catch {
    return false;
  }
}
