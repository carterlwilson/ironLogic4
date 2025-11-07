import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  forgotPassword,
  resetPassword,
  validateResetToken,
} from '../controllers/passwordReset.js';

const router = Router();

// Rate limiter for forgot password endpoint
// Limit to 3 requests per 15 minutes per IP to prevent abuse
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 3, // Limit each IP to 3 requests per windowMs
  message: 'Too many password reset requests from this IP, please try again after 15 minutes.',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // Use skipFailedRequests to not count failed requests
  skipFailedRequests: false,
  validate: {
    trustProxy: false, // Disable trust proxy validation for Railway
  },
});

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset email
 * @access  Public
 * @rateLimit 3 requests per 15 minutes per IP
 */
router.post('/forgot-password', forgotPasswordLimiter, forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', resetPassword);

/**
 * @route   GET /api/auth/validate-reset-token
 * @desc    Validate a password reset token
 * @access  Public
 */
router.get('/validate-reset-token', validateResetToken);

export default router;
