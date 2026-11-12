import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Salted verifier exists only in RAM; no schema change or plaintext user table.
export function passwordVerifier(password) {
  if (typeof password !== 'string' || !password) return null;
  const salt = randomBytes(16);
  const digest = scryptSync(password, salt, 32);
  return candidate => typeof candidate === 'string'
    && Buffer.byteLength(candidate) <= 16384
    && timingSafeEqual(scryptSync(candidate, salt, 32), digest);
}

export const sessionKey = token => createHash('sha256').update(token).digest('hex');
