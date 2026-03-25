import { Request, Response } from 'express';
import { User } from '../models/User.js';
import { generateToken, generateRefreshToken, getRefreshTokenExpiry, comparePassword } from '../utils/auth.js';
import { AcceptInviteSchema } from '@ironlogic4/shared';

/**
 * @route   GET /api/auth/validate-invite-token
 * @desc    Validate a client invite token
 * @access  Public
 */
export const validateInviteToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.query;

    if (!token || typeof token !== 'string') {
      res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid or missing invite token',
      });
      return;
    }

    // Find users with unexpired, unused invite tokens
    const users = await User.find({
      inviteTokenExpiry: { $gt: new Date() },
      inviteTokenUsed: { $ne: true },
      status: 'invited',
    }).select('+inviteToken +inviteTokenExpiry +inviteTokenUsed');

    let matchedUser = null;
    for (const u of users) {
      if (u.inviteToken) {
        const isMatch = await comparePassword(token, u.inviteToken);
        if (isMatch) {
          matchedUser = u;
          break;
        }
      }
    }

    if (!matchedUser) {
      res.status(400).json({
        success: false,
        valid: false,
        message: 'Invalid or expired invite token',
      });
      return;
    }

    res.status(200).json({
      success: true,
      valid: true,
      data: {
        email: matchedUser.email,
        firstName: matchedUser.firstName || undefined,
        lastName: matchedUser.lastName || undefined,
      },
    });
  } catch (error) {
    console.error('[INVITE] Error validating invite token:', error);
    res.status(500).json({
      success: false,
      valid: false,
      message: 'An error occurred while validating the invite token',
    });
  }
};

/**
 * @route   POST /api/auth/accept-invite
 * @desc    Accept a client invite: set name + password, activate account, return tokens
 * @access  Public
 */
export const acceptInvite = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = AcceptInviteSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        message: 'Invalid request data',
        details: validation.error.errors,
      });
      return;
    }

    const { token, firstName, lastName, password } = validation.data;

    // Find users with unexpired, unused invite tokens
    const users = await User.find({
      inviteTokenExpiry: { $gt: new Date() },
      inviteTokenUsed: { $ne: true },
      status: 'invited',
    }).select('+inviteToken +inviteTokenExpiry +inviteTokenUsed +password');

    let user = null;
    for (const u of users) {
      if (u.inviteToken) {
        const isMatch = await comparePassword(token, u.inviteToken);
        if (isMatch) {
          user = u;
          break;
        }
      }
    }

    if (!user) {
      res.status(400).json({
        success: false,
        message: 'Invalid or expired invite token',
      });
      return;
    }

    // Activate the account
    user.firstName = firstName;
    user.lastName = lastName;
    user.password = password; // pre-save hook will hash this
    user.status = 'active';
    user.inviteToken = undefined;
    user.inviteTokenExpiry = undefined;
    user.inviteTokenUsed = true;

    // Generate tokens (same as login flow)
    const accessToken = generateToken(user.id);
    const refreshToken = generateRefreshToken();
    const refreshExpiry = getRefreshTokenExpiry();

    // Clean up expired refresh tokens and add new one
    user.refreshTokens = user.refreshTokens.filter(rt => rt.expiresAt > new Date());
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens.shift();
    }
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: refreshExpiry,
    });

    await user.save();

    console.log(`[INVITE] Account activated for user: ${user.email}`);

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: user.toJSON(),
      },
      message: 'Account created successfully',
    });
  } catch (error) {
    console.error('[INVITE] Error accepting invite:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while creating your account',
    });
  }
};
