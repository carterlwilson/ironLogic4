import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { generateResetToken, hashResetToken } from '../utils/tokenGenerator.js';
import { sendPasswordResetEmail } from '../utils/emailService.js';
import { hashPassword, comparePassword } from '../utils/auth.js';

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Send password reset email to user
 * @access  Public
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate email format
    if (!email || typeof email !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        message: 'Please provide a valid email address',
      });
      return;
    }

    // Find user by email (don't reveal if user exists or not)
    const user = await User.findOne({ email: email.toLowerCase() });

    // Always return success to prevent email enumeration
    // Even if user doesn't exist, we return the same response
    if (!user) {
      console.log(`[PASSWORD RESET] Reset requested for non-existent email: ${email}`);
      res.status(200).json({
        success: true,
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
      return;
    }

    // Generate reset token
    const resetToken = generateResetToken();
    const hashedToken = await hashResetToken(resetToken);

    // Set token expiry to 30 minutes from now
    const tokenExpiry = new Date();
    tokenExpiry.setMinutes(tokenExpiry.getMinutes() + 30);

    // Save hashed token to user document
    user.resetToken = hashedToken;
    user.resetTokenExpiry = tokenExpiry;
    user.resetTokenUsed = false;
    await user.save();

    // Send password reset email
    try {
      await sendPasswordResetEmail(user.email, user.firstName, resetToken);
      console.log(`[PASSWORD RESET] Reset email sent to: ${user.email}`);
    } catch (emailError) {
      // If email fails, clean up the token
      user.resetToken = undefined;
      user.resetTokenExpiry = undefined;
      user.resetTokenUsed = undefined;
      await user.save();

      console.error('[PASSWORD RESET] Failed to send email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email. Please try again later.',
      });
      return;
    }

    // Return success response (same as when user doesn't exist)
    res.status(200).json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    console.error('[PASSWORD RESET ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while processing your request',
    });
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password with token
 * @access  Public
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    // Validate input
    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Invalid or missing reset token',
      });
      return;
    }

    if (!newPassword || typeof newPassword !== 'string') {
      res.status(400).json({
        success: false,
        message: 'Please provide a new password',
      });
      return;
    }

    // Validate password strength
    if (newPassword.length < 8) {
      res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long',
      });
      return;
    }

    // Hash the provided token to match against stored hash
    const hashedToken = await hashResetToken(token);

    // Find all users with reset tokens to check against
    // We need to select the reset token fields explicitly since they're not selected by default
    const users = await User.find({
      resetTokenExpiry: { $gt: new Date() }, // Token hasn't expired
      resetTokenUsed: { $ne: true }, // Token hasn't been used
    }).select('+resetToken +resetTokenExpiry +resetTokenUsed');

    // Find the user with the matching token
    let user = null;
    for (const u of users) {
      if (u.resetToken) {
        const isMatch = await comparePassword(token, u.resetToken);
        if (isMatch) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token',
      });
      return;
    }

    // Update password (will be hashed by pre-save middleware)
    user.password = newPassword;

    // Clear reset token fields
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.resetTokenUsed = true; // Mark as used

    await user.save();

    console.log(`[PASSWORD RESET] Password successfully reset for user: ${user.email}`);

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You can now log in with your new password.',
    });
  } catch (error) {
    console.error('[PASSWORD RESET ERROR]', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while resetting your password',
    });
  }
};

/**
 * @route   GET /api/auth/validate-reset-token
 * @desc    Validate a password reset token
 * @access  Public
 */
export const validateResetToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    // Validate token parameter
    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid or missing reset token',
      });
      return;
    }

    // Hash the provided token
    const hashedToken = await hashResetToken(token);

    // Find all users with unexpired, unused reset tokens
    const users = await User.find({
      resetTokenExpiry: { $gt: new Date() },
      resetTokenUsed: { $ne: true },
    }).select('+resetToken +resetTokenExpiry +resetTokenUsed');

    // Check if any user has a matching token
    let isValid = false;
    for (const u of users) {
      if (u.resetToken) {
        const isMatch = await comparePassword(token, u.resetToken);
        if (isMatch) {
          isValid = true;
          break;
        }
      }
    }

    if (isValid) {
      res.status(200).json({
        success: true,
        valid: true,
        message: 'Token is valid',
      });
    } else {
      res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid or expired reset token',
      });
    }
  } catch (error) {
    console.error('[VALIDATE TOKEN ERROR]', error);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'An error occurred while validating the token',
    });
  }
};
