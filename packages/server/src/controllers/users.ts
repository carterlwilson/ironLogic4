import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { User } from '../models/User';
import { CreateUserSchema } from '@ironlogic4/shared/schemas/users';
import { ApiResponse, PaginatedResponse } from '@ironlogic4/shared/types/api';
import { UserType } from '@ironlogic4/shared/types/users';
import { z } from 'zod';
import { generateRandomPassword } from '../utils/auth';

// Update user schema for validation
const UpdateUserSchema = z.object({
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  userType: z.nativeEnum(UserType).optional(),
  password: z.string().min(6).optional(),
  gymId: z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
  message: "At least one field must be provided for update",
});

/**
 * Get all users with pagination
 */
export const getAllUsers = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search as string;
    const roleFilter = req.query.role as string;

    // Ensure limit is reasonable
    const maxLimit = Math.min(limit, 100);

    // Build query object
    let query: any = {};

    // Add search functionality (firstName, lastName, email)
    if (searchQuery && searchQuery.trim()) {
      query.$or = [
        { firstName: { $regex: searchQuery.trim(), $options: 'i' } },
        { lastName: { $regex: searchQuery.trim(), $options: 'i' } },
        { email: { $regex: searchQuery.trim(), $options: 'i' } }
      ];
    }

    // Add role filtering
    if (roleFilter && Object.values(UserType).includes(roleFilter as UserType)) {
      query.userType = roleFilter;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(maxLimit),
      User.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / maxLimit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: users,
      pagination: {
        page,
        limit: maxLimit,
        total,
        totalPages,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch users',
    } as ApiResponse);
  }
};

/**
 * Get user by ID
 */
export const getUserById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).select('-password');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: user,
    } as ApiResponse);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user',
    } as ApiResponse);
  }
};

/**
 * Create new user (for admin/coach creating other users)
 */
export const createUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // Validate request body
    const validationResult = CreateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid user data',
        message: validationResult.error.errors.map(e => e.message).join(', '),
      } as ApiResponse);
      return;
    }

    const { email, password, firstName, lastName, userType, gymId } = validationResult.data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      } as ApiResponse);
      return;
    }

    // Create new user
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      userType,
      gymId,
    });

    await user.save();

    // Return user without password
    const userResponse = user.toJSON();

    res.status(201).json({
      success: true,
      data: userResponse,
      message: 'User created successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create user',
    } as ApiResponse);
  }
};

/**
 * Update user
 */
export const updateUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Validate request body
    const validationResult = UpdateUserSchema.safeParse(req.body);
    if (!validationResult.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid update data',
        message: validationResult.error.errors.map(e => e.message).join(', '),
      } as ApiResponse);
      return;
    }

    const updateData = validationResult.data;

    // Find the user to update
    const existingUser = await User.findById(id);
    if (!existingUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    // Check if email is being updated and if it's already taken
    if (updateData.email && updateData.email !== existingUser.email) {
      const emailExists = await User.findOne({ email: updateData.email });
      if (emailExists) {
        res.status(409).json({
          success: false,
          error: 'Email is already in use by another user',
        } as ApiResponse);
        return;
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      data: updatedUser,
      message: 'User updated successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update user',
    } as ApiResponse);
  }
};

/**
 * Delete user
 */
export const deleteUser = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;

    // Prevent users from deleting themselves
    if (req.user && req.user.id.toString() === id) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete your own account',
      } as ApiResponse);
      return;
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    res.json({
      success: true,
      message: 'User deleted successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete user',
    } as ApiResponse);
  }
};

/**
 * Reset user password (admin only)
 */
export const resetUserPassword = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { id } = req.params;
    const { generateRandom } = req.body;

    // Find the user
    const user = await User.findById(id);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      } as ApiResponse);
      return;
    }

    // Prevent admin from resetting their own password through this endpoint
    if (req.user && req.user.id.toString() === id) {
      res.status(400).json({
        success: false,
        error: 'Cannot reset your own password through this endpoint',
      } as ApiResponse);
      return;
    }

    let newPassword: string;

    if (generateRandom) {
      // Generate a random password
      newPassword = generateRandomPassword(12);
    } else {
      // Use provided password or generate random if not provided
      newPassword = req.body.newPassword || generateRandomPassword(12);

      // Validate password if provided
      if (req.body.newPassword && req.body.newPassword.length < 6) {
        res.status(400).json({
          success: false,
          error: 'Password must be at least 6 characters long',
        } as ApiResponse);
        return;
      }
    }

    // Update the user's password
    user.password = newPassword;
    await user.save();

    res.json({
      success: true,
      data: {
        newPassword: generateRandom || !req.body.newPassword ? newPassword : undefined,
        message: generateRandom || !req.body.newPassword
          ? 'Password reset successfully. New password is provided in response.'
          : 'Password reset successfully.',
      },
      message: 'User password reset successfully',
    } as ApiResponse);
  } catch (error) {
    console.error('Error resetting user password:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset user password',
    } as ApiResponse);
  }
};