"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetUserPassword = exports.deleteUser = exports.updateUser = exports.createUser = exports.getUserById = exports.getAllUsers = void 0;
const User_1 = require("../models/User");
const users_1 = require("@ironlogic4/shared/schemas/users");
const users_2 = require("@ironlogic4/shared/types/users");
const zod_1 = require("zod");
const auth_1 = require("../utils/auth");
// Update user schema for validation
const UpdateUserSchema = zod_1.z.object({
    email: zod_1.z.string().email().optional(),
    firstName: zod_1.z.string().min(1).optional(),
    lastName: zod_1.z.string().min(1).optional(),
    userType: zod_1.z.nativeEnum(users_2.UserType).optional(),
    password: zod_1.z.string().min(6).optional(),
    gymId: zod_1.z.string().optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
});
/**
 * Get all users with pagination
 */
const getAllUsers = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search;
        const roleFilter = req.query.role;
        // Ensure limit is reasonable
        const maxLimit = Math.min(limit, 100);
        // Build query object
        let query = {};
        // Add search functionality (firstName, lastName, email)
        if (searchQuery && searchQuery.trim()) {
            query.$or = [
                { firstName: { $regex: searchQuery.trim(), $options: 'i' } },
                { lastName: { $regex: searchQuery.trim(), $options: 'i' } },
                { email: { $regex: searchQuery.trim(), $options: 'i' } }
            ];
        }
        // Add role filtering
        if (roleFilter && Object.values(users_2.UserType).includes(roleFilter)) {
            query.userType = roleFilter;
        }
        const [users, total] = await Promise.all([
            User_1.User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(maxLimit),
            User_1.User.countDocuments(query)
        ]);
        const totalPages = Math.ceil(total / maxLimit);
        const response = {
            success: true,
            data: users.map(u => u.toJSON()),
            pagination: {
                page,
                limit: maxLimit,
                total,
                totalPages,
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch users',
        });
    }
};
exports.getAllUsers = getAllUsers;
/**
 * Get user by ID
 */
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await User_1.User.findById(id).select('-password');
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }
        res.json({
            success: true,
            data: user.toJSON(),
        });
    }
    catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user',
        });
    }
};
exports.getUserById = getUserById;
/**
 * Create new user (for admin/coach creating other users)
 */
const createUser = async (req, res) => {
    try {
        // Validate request body
        const validationResult = users_1.CreateUserSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid user data',
                message: validationResult.error.errors.map(e => e.message).join(', '),
            });
            return;
        }
        const { email, password, firstName, lastName, userType, gymId } = validationResult.data;
        // Check if user already exists
        const existingUser = await User_1.User.findOne({ email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                error: 'User with this email already exists',
            });
            return;
        }
        // Create new user
        const user = new User_1.User({
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
        });
    }
    catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create user',
        });
    }
};
exports.createUser = createUser;
/**
 * Update user
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate request body
        const validationResult = UpdateUserSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid update data',
                message: validationResult.error.errors.map(e => e.message).join(', '),
            });
            return;
        }
        const updateData = validationResult.data;
        // Find the user to update
        const existingUser = await User_1.User.findById(id);
        if (!existingUser) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }
        // Check if email is being updated and if it's already taken
        if (updateData.email && updateData.email !== existingUser.email) {
            const emailExists = await User_1.User.findOne({ email: updateData.email });
            if (emailExists) {
                res.status(409).json({
                    success: false,
                    error: 'Email is already in use by another user',
                });
                return;
            }
        }
        // Update user
        const updatedUser = await User_1.User.findByIdAndUpdate(id, updateData, { new: true, runValidators: true }).select('-password');
        if (!updatedUser) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }
        res.json({
            success: true,
            data: updatedUser ? updatedUser.toJSON() : null,
            message: 'User updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update user',
        });
    }
};
exports.updateUser = updateUser;
/**
 * Delete user
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        // Prevent users from deleting themselves
        if (req.user && req.user.id.toString() === id) {
            res.status(400).json({
                success: false,
                error: 'Cannot delete your own account',
            });
            return;
        }
        const user = await User_1.User.findByIdAndDelete(id);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }
        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete user',
        });
    }
};
exports.deleteUser = deleteUser;
/**
 * Reset user password (admin only)
 */
const resetUserPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { generateRandom } = req.body;
        // Find the user
        const user = await User_1.User.findById(id);
        if (!user) {
            res.status(404).json({
                success: false,
                error: 'User not found',
            });
            return;
        }
        // Prevent admin from resetting their own password through this endpoint
        if (req.user && req.user.id.toString() === id) {
            res.status(400).json({
                success: false,
                error: 'Cannot reset your own password through this endpoint',
            });
            return;
        }
        let newPassword;
        if (generateRandom) {
            // Generate a random password
            newPassword = (0, auth_1.generateRandomPassword)(12);
        }
        else {
            // Use provided password or generate random if not provided
            newPassword = req.body.newPassword || (0, auth_1.generateRandomPassword)(12);
            // Validate password if provided
            if (req.body.newPassword && req.body.newPassword.length < 6) {
                res.status(400).json({
                    success: false,
                    error: 'Password must be at least 6 characters long',
                });
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
        });
    }
    catch (error) {
        console.error('Error resetting user password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset user password',
        });
    }
};
exports.resetUserPassword = resetUserPassword;
//# sourceMappingURL=users.js.map