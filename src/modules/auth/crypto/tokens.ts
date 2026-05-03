import { createHash, createHmac, randomBytes, timingSafeEqual } from 'crypto';

export function generateRefreshTokenRaw(): string {
  return randomBytes(48).toString('base64url');
}

export function hashRefreshToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

export function hashEmailOtp(email: string, code: string, pepper: string): string {
  return createHmac('sha256', pepper).update(email.toLowerCase()).update('|').update(code).digest('hex');
}

export function verifyEmailOtp(
  email: string,
  code: string,
  pepper: string,
  storedHex: string,
): boolean {
  const computed = hashEmailOtp(email, code, pepper);
  try {
    const a = Buffer.from(computed, 'hex');
    const b = Buffer.from(storedHex, 'hex');
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
