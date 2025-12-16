import { Request, Response } from 'express';
import { RegisterSchema, LoginSchema } from '@ironlogic4/shared/schemas/auth';
import { ApiResponse } from '@ironlogic4/shared/types/api';
import { User } from '../models/User.js';
import { Gym } from '../models/Gym.js';
import { generateToken, generateRefreshToken, getRefreshTokenExpiry } from '../utils/auth.js';

/**
 * Register a new user
 */
export const registerUser = async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request body using RegisterSchema
    const validationResult = RegisterSchema.safeParse(req.body);

    if (!validationResult.success) {
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        message: validationResult.error.errors.map(e => e.message).join(', ')
      };
      res.status(400).json(response);
      return;
    }

    const { email, password, firstName, lastName, userType, gymId } = validationResult.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      const response: ApiResponse = {
        success: false,
        error: 'User already exists',
        message: 'A user with this email address already exists'
      };
      res.status(409).json(response);
      return;
    }

    // Create new user (password will be auto-hashed by the model)
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      userType,
      gymId
    });

    await user.save();

    // Return success response with user data (password excluded by model)
    const response: ApiResponse = {
      success: true,
      data: user.toJSON(),
      message: 'User registered successfully'
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Registration error:', error);

    // Handle duplicate key error (in case unique index catches it)
    if (error instanceof Error && 'code' in error && (error as any).code === 11000) {
      const response: ApiResponse = {
        success: false,
        error: 'User already exists',
        message: 'A user with this email address already exists'
      };
      res.status(409).json(response);
      return;
    }

    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during registration'
    };
    res.status(500).json(response);
  }
};

/**
 * Login user and return JWT token
 */
export const loginUser = async (req: Request, res: Response): Promise<void> => {
  try {
      console.log("logging in user")
    // Validate request body using LoginSchema
    const validationResult = LoginSchema.safeParse(req.body);

    if (!validationResult.success) {
      const response: ApiResponse = {
        success: false,
        error: 'Validation failed',
        message: validationResult.error.errors.map(e => e.message).join(', ')
      };
      console.log(response);
      res.status(400).json(response);
      return;
    }

    const { email, password } = validationResult.data;

    // Find user by email and include password field
    const user = await User.findOne({ email }).select('+password');
    console.log('User lookup for email:', email);
    console.log('User found:', user ? 'YES' : 'NO');
    if (user) {
      console.log('User email from DB:', user.email);
      console.log('User has password field:', !!user.password);
    }
    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      };
      res.status(401).json(response);
      return;
    }

    // Compare password using user.comparePassword method
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password comparison result:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Password validation FAILED for user:', user.email);
      const response: ApiResponse = {
        success: false,
        error: 'Invalid credentials',
        message: 'Invalid email or password'
      };
      res.status(401).json(response);
      return;
    }

    // Fetch gym name if user has a gymId
    let gymName: string | undefined;
    if (user.gymId) {
      const gym = await Gym.findById(user.gymId).select('name');
      gymName = gym?.name;
    }

    // Generate access token (JWT)
    const accessToken = generateToken(user.id);

    // Generate refresh token (random)
    const refreshToken = generateRefreshToken();
    const refreshExpiry = getRefreshTokenExpiry();

    // Clean up expired refresh tokens
    user.refreshTokens = user.refreshTokens.filter(
      rt => rt.expiresAt > new Date()
    );

    // Add new refresh token (limit to 5 devices)
    if (user.refreshTokens.length >= 5) {
      user.refreshTokens.shift(); // Remove oldest
    }
    user.refreshTokens.push({
      token: refreshToken,
      createdAt: new Date(),
      expiresAt: refreshExpiry,
    });

    await user.save();

    // Return success response with both tokens and user data (password excluded)
    const userData = user.toJSON();
    const response: ApiResponse = {
      success: true,
      data: {
        accessToken,
        refreshToken,
        user: { ...userData, gymName }
      },
      message: 'Login successful'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Login error:', error);

    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during login'
    };
    res.status(500).json(response);
  }
};

/**
 * Refresh access token using refresh token
 */
export const refreshAccessToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      const response: ApiResponse = {
        success: false,
        error: 'Refresh token required',
        message: 'Refresh token is required'
      };
      res.status(400).json(response);
      return;
    }

    // Find user with this refresh token
    const user = await User.findOne({
      'refreshTokens.token': refreshToken,
    });

    if (!user) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid refresh token',
        message: 'Invalid refresh token'
      };
      res.status(401).json(response);
      return;
    }

    // Find the specific refresh token
    const tokenData = user.refreshTokens.find(rt => rt.token === refreshToken);

    if (!tokenData) {
      const response: ApiResponse = {
        success: false,
        error: 'Invalid refresh token',
        message: 'Invalid refresh token'
      };
      res.status(401).json(response);
      return;
    }

    // Check if token is expired
    if (tokenData.expiresAt < new Date()) {
      // Remove expired token
      user.refreshTokens = user.refreshTokens.filter(
        rt => rt.token !== refreshToken
      );
      await user.save();

      const response: ApiResponse = {
        success: false,
        error: 'Refresh token expired',
        message: 'Refresh token expired'
      };
      res.status(401).json(response);
      return;
    }

    // Generate new access token
    const accessToken = generateToken(user.id);

    // Rotate refresh token for security
    const newRefreshToken = generateRefreshToken();
    const refreshExpiry = getRefreshTokenExpiry();

    // Remove old refresh token and add new one
    user.refreshTokens = user.refreshTokens.filter(
      rt => rt.token !== refreshToken
    );
    user.refreshTokens.push({
      token: newRefreshToken,
      createdAt: new Date(),
      expiresAt: refreshExpiry,
    });

    await user.save();

    const response: ApiResponse = {
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken,
      },
      message: 'Token refreshed successfully'
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Refresh token error:', error);

    const response: ApiResponse = {
      success: false,
      error: 'Internal server error',
      message: 'Failed to refresh token'
    };
    res.status(500).json(response);
  }
};