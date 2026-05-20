import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

/**
 * Generate a JWT token for the given user ID
 */
export const generateToken = (userId: string): string => {
  const secret = process.env.JWT_SECRET;
  const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

  if (!secret) {
    throw new Error('JWT_SECRET environment variable is not set');
  }

  return jwt.sign({ userId }, secret, { expiresIn } as jwt.SignOptions);
};

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  const saltRounds = 12;
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compare a plain text password with a hashed password
 */
export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

/**
 * Generate a random password
 */
export const generateRandomPassword = (length: number = 12): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  const bytes = crypto.randomBytes(length);
  return Array.from(bytes)
    .map(b => chars[b % chars.length])
    .join('');
};

/**
 * Generate a cryptographically secure random refresh token
 */
export const generateRefreshToken = (): string => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * Calculate refresh token expiry date based on environment variable
 */
export const getRefreshTokenExpiry = (): Date => {
  const expiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '90d';
  const days = parseInt(expiresIn.replace('d', ''), 10);
  const safeDays = Number.isFinite(days) && days > 0 ? days : 90;
  if (safeDays !== days) {
    console.warn(`[auth] Invalid JWT_REFRESH_EXPIRES_IN "${expiresIn}", defaulting to 90 days`);
  }
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + safeDays);
  return expiry;
};