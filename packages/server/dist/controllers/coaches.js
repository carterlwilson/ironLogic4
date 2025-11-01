"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetCoachPassword = exports.deleteCoach = exports.updateCoach = exports.createCoach = exports.getCoachById = exports.getAllCoaches = void 0;
const User_1 = require("../models/User");
const ActiveSchedule_1 = require("../models/ActiveSchedule");
const shared_1 = require("@ironlogic4/shared");
const auth_1 = require("../utils/auth");
/**
 * Get all coaches with pagination, search, and gym scoping
 */
const getAllCoaches = async (req, res) => {
    try {
        const validation = shared_1.CoachListParamsSchema.safeParse(req.query);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: validation.error.errors,
            });
            return;
        }
        const { gymId, search, page, limit } = validation.data;
        const skip = (page - 1) * limit;
        const query = { userType: shared_1.UserType.COACH };
        // Gym scoping: owners can only see their gym's coaches, admins can filter by gymId
        if (req.user?.userType === shared_1.UserType.OWNER) {
            query.gymId = req.user.gymId;
        }
        else if (gymId) {
            query.gymId = gymId;
        }
        // Search by name or email
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
            ];
        }
        const [coaches, total] = await Promise.all([
            User_1.User.find(query)
                .select('-password')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            User_1.User.countDocuments(query),
        ]);
        const totalPages = Math.ceil(total / limit);
        const response = {
            success: true,
            data: coaches.map(coach => coach.toJSON()),
            pagination: {
                page,
                limit,
                total,
                totalPages,
            },
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching coaches:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch coaches',
        });
    }
};
exports.getAllCoaches = getAllCoaches;
/**
 * Get a single coach by ID
 */
const getCoachById = async (req, res) => {
    try {
        const validation = shared_1.CoachIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid coach ID',
            });
            return;
        }
        const { id } = validation.data;
        const coach = await User_1.User.findById(id).select('-password');
        if (!coach) {
            res.status(404).json({
                success: false,
                error: 'Coach not found',
            });
            return;
        }
        // Verify coach is actually a COACH user type
        if (coach.userType !== shared_1.UserType.COACH) {
            res.status(404).json({
                success: false,
                error: 'Coach not found',
            });
            return;
        }
        // Gym scoping: owners can only access their gym's coaches
        if (req.user?.userType === shared_1.UserType.OWNER && coach.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own gym\'s coaches.',
            });
            return;
        }
        const response = {
            success: true,
            data: coach.toJSON(),
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching coach:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch coach',
        });
    }
};
exports.getCoachById = getCoachById;
/**
 * Create a new coach
 */
const createCoach = async (req, res) => {
    try {
        const validation = shared_1.CreateCoachSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid coach data',
                details: validation.error.errors,
            });
            return;
        }
        const { email, firstName, lastName, gymId, password } = validation.data;
        // Determine the actual gymId to use
        let actualGymId;
        if (req.user?.userType === shared_1.UserType.OWNER) {
            // Owners always create coaches in their own gym
            actualGymId = req.user.gymId;
        }
        else if (req.user?.userType === shared_1.UserType.ADMIN) {
            // Admins must provide a gymId
            if (!gymId) {
                res.status(400).json({
                    success: false,
                    error: 'Gym ID is required for admin users',
                });
                return;
            }
            actualGymId = gymId;
        }
        else {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions to create coaches',
            });
            return;
        }
        // Check if user with this email already exists
        const existingUser = await User_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(409).json({
                success: false,
                error: 'A user with this email already exists',
            });
            return;
        }
        // Password generation logic
        let finalPassword;
        let temporaryPassword;
        if (password) {
            // Use provided password
            finalPassword = password;
        }
        else {
            // Generate random password
            finalPassword = (0, auth_1.generateRandomPassword)(12);
            temporaryPassword = finalPassword;
        }
        // Create the coach - ALWAYS set userType to COACH
        const newCoach = new User_1.User({
            email: email.toLowerCase(),
            firstName,
            lastName,
            userType: shared_1.UserType.COACH,
            gymId: actualGymId,
            password: finalPassword,
        });
        const savedCoach = await newCoach.save();
        // Return coach data without password, but include temporary password if generated
        const coachData = savedCoach.toJSON();
        const response = {
            success: true,
            data: {
                ...coachData,
                ...(temporaryPassword && { temporaryPassword }),
            },
            message: 'Coach created successfully',
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating coach:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create coach',
        });
    }
};
exports.createCoach = createCoach;
/**
 * Update a coach
 */
const updateCoach = async (req, res) => {
    try {
        const paramsValidation = shared_1.CoachIdSchema.safeParse(req.params);
        const bodyValidation = shared_1.UpdateCoachSchema.safeParse(req.body);
        if (!paramsValidation.success || !bodyValidation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: [...(paramsValidation.error?.errors || []), ...(bodyValidation.error?.errors || [])],
            });
            return;
        }
        const { id } = paramsValidation.data;
        const validatedData = bodyValidation.data;
        // Check for disallowed fields
        const disallowedFields = ['gymId', 'userType', 'password'];
        const providedFields = Object.keys(req.body);
        const foundDisallowed = providedFields.find(field => disallowedFields.includes(field));
        if (foundDisallowed) {
            res.status(400).json({
                success: false,
                error: `Field '${foundDisallowed}' cannot be updated through this endpoint`,
            });
            return;
        }
        const coach = await User_1.User.findById(id);
        if (!coach) {
            res.status(404).json({
                success: false,
                error: 'Coach not found',
            });
            return;
        }
        // Verify coach is actually a COACH user type
        if (coach.userType !== shared_1.UserType.COACH) {
            res.status(404).json({
                success: false,
                error: 'Coach not found',
            });
            return;
        }
        // Gym scoping: owners can only update their gym's coaches
        if (req.user?.userType === shared_1.UserType.OWNER && coach.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only update your own gym\'s coaches.',
            });
            return;
        }
        // Check if email is being changed and if it's already taken
        if (validatedData.email && validatedData.email !== coach.email) {
            const existingUser = await User_1.User.findOne({ email: validatedData.email });
            if (existingUser) {
                res.status(409).json({
                    success: false,
                    error: 'A user with this email already exists',
                });
                return;
            }
        }
        const updatedCoach = await User_1.User.findByIdAndUpdate(id, validatedData, { new: true, runValidators: true }).select('-password');
        const response = {
            success: true,
            data: updatedCoach ? updatedCoach.toJSON() : null,
            message: 'Coach updated successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating coach:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update coach',
        });
    }
};
exports.updateCoach = updateCoach;
/**
 * Delete a coach (hard delete with dependency checks)
 */
const deleteCoach = async (req, res) => {
    try {
        const validation = shared_1.CoachIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid coach ID',
            });
            return;
        }
        const { id } = validation.data;
        const coach = await User_1.User.findById(id);
        if (!coach) {
            res.status(404).json({
                success: false,
                error: 'Coach not found',
            });
            return;
        }
        // Verify coach is actually a COACH user type
        if (coach.userType !== shared_1.UserType.COACH) {
            res.status(404).json({
                success: false,
                error: 'Coach not found',
            });
            return;
        }
        // Gym scoping: owners can only delete their gym's coaches
        if (req.user?.userType === shared_1.UserType.OWNER && coach.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only delete your own gym\'s coaches.',
            });
            return;
        }
        // Check for dependencies before deletion
        // 1. Check for active schedules
        const activeSchedules = await ActiveSchedule_1.ActiveSchedule.findOne({
            coachIds: id,
        });
        if (activeSchedules) {
            res.status(409).json({
                success: false,
                error: 'Cannot delete coach. Coach is assigned to active schedules.',
            });
            return;
        }
        // 2. Check for assigned clients (if assignedCoachId field exists)
        const assignedClients = await User_1.User.findOne({
            userType: shared_1.UserType.CLIENT,
            assignedCoachId: id,
        });
        if (assignedClients) {
            res.status(409).json({
                success: false,
                error: 'Cannot delete coach. Coach has assigned clients.',
            });
            return;
        }
        // No dependencies found, proceed with hard delete
        await User_1.User.findByIdAndDelete(id);
        const response = {
            success: true,
            message: 'Coach deleted successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting coach:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete coach',
        });
    }
};
exports.deleteCoach = deleteCoach;
/**
 * Reset a coach's password
 */
const resetCoachPassword = async (req, res) => {
    try {
        const paramsValidation = shared_1.CoachIdSchema.safeParse(req.params);
        const bodyValidation = shared_1.ResetCoachPasswordSchema.safeParse(req.body);
        if (!paramsValidation.success || !bodyValidation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: [...(paramsValidation.error?.errors || []), ...(bodyValidation.error?.errors || [])],
            });
            return;
        }
        const { id } = paramsValidation.data;
        const { password } = bodyValidation.data;
        const coach = await User_1.User.findById(id).select('+password');
        if (!coach) {
            res.status(404).json({
                success: false,
                error: 'Coach not found',
            });
            return;
        }
        // Verify coach is actually a COACH user type
        if (coach.userType !== shared_1.UserType.COACH) {
            res.status(404).json({
                success: false,
                error: 'Coach not found',
            });
            return;
        }
        // Gym scoping: owners can only reset passwords for their gym's coaches
        if (req.user?.userType === shared_1.UserType.OWNER && coach.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only reset passwords for your own gym\'s coaches.',
            });
            return;
        }
        // Password generation logic
        let finalPassword;
        let temporaryPassword;
        if (password) {
            // Use provided password
            finalPassword = password;
        }
        else {
            // Generate random password
            finalPassword = (0, auth_1.generateRandomPassword)(12);
            temporaryPassword = finalPassword;
        }
        // Hash and update password
        coach.password = finalPassword;
        await coach.save();
        const response = {
            success: true,
            message: 'Password reset successfully',
            ...(temporaryPassword && { data: { temporaryPassword } }),
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error resetting coach password:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset coach password',
        });
    }
};
exports.resetCoachPassword = resetCoachPassword;
//# sourceMappingURL=coaches.js.map