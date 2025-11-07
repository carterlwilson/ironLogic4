import crypto from 'crypto';
import { hashPassword } from './auth.js';

/**
 * Generate a secure random reset token using crypto.randomBytes
 * @returns A 64-character hexadecimal token (256 bits of entropy)
 */
export const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Hash a reset token for secure storage
 * Uses the same bcrypt hashing as passwords for consistency
 * @param token The plain text token to hash
 * @returns The hashed token
 */
export const hashResetToken = async (token: string): Promise<string> => {
  return hashPassword(token);
};
