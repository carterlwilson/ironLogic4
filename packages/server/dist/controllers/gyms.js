"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteGym = exports.updateGym = exports.createGym = exports.getGymById = exports.getAllGyms = void 0;
const Gym_1 = require("../models/Gym");
const User_1 = require("../models/User");
const gyms_1 = require("@ironlogic4/shared/schemas/gyms");
const zod_1 = require("zod");
// Update gym schema for validation
const UpdateGymSchema = zod_1.z.object({
    name: zod_1.z.string().min(1).optional(),
    address: zod_1.z.string().min(1).optional(),
    phoneNumber: zod_1.z.string().min(1).optional(),
    ownerId: zod_1.z.string().min(1).optional(),
}).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
});
/**
 * Get all gyms with pagination
 */
const getAllGyms = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        const searchQuery = req.query.search;
        const ownerIdFilter = req.query.ownerId;
        // Ensure limit is reasonable
        const maxLimit = Math.min(limit, 100);
        // Build query object
        let query = {};
        // Add search functionality (name, address)
        if (searchQuery && searchQuery.trim()) {
            query.$or = [
                { name: { $regex: searchQuery.trim(), $options: 'i' } },
                { address: { $regex: searchQuery.trim(), $options: 'i' } }
            ];
        }
        // Add owner filtering
        if (ownerIdFilter) {
            query.ownerId = ownerIdFilter;
        }
        const [gyms, total] = await Promise.all([
            Gym_1.Gym.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(maxLimit),
            Gym_1.Gym.countDocuments(query)
        ]);
        const totalPages = Math.ceil(total / maxLimit);
        const response = {
            success: true,
            data: gyms.map(gym => gym.toJSON()),
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
        console.error('Error fetching gyms:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch gyms',
        });
    }
};
exports.getAllGyms = getAllGyms;
/**
 * Get gym by ID
 */
const getGymById = async (req, res) => {
    try {
        const { id } = req.params;
        const gym = await Gym_1.Gym.findById(id);
        if (!gym) {
            res.status(404).json({
                success: false,
                error: 'Gym not found',
            });
            return;
        }
        res.json({
            success: true,
            data: gym.toJSON(),
        });
    }
    catch (error) {
        console.error('Error fetching gym:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch gym',
        });
    }
};
exports.getGymById = getGymById;
/**
 * Create new gym (admin only)
 */
const createGym = async (req, res) => {
    try {
        // Validate request body
        const validationResult = gyms_1.CreateGymSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid gym data',
                message: validationResult.error.errors.map(e => e.message).join(', '),
            });
            return;
        }
        const { name, address, phoneNumber, ownerId } = validationResult.data;
        // Check if gym with same name already exists
        const existingGym = await Gym_1.Gym.findOne({ name });
        if (existingGym) {
            res.status(409).json({
                success: false,
                error: 'Gym with this name already exists',
            });
            return;
        }
        // Create new gym
        const gym = new Gym_1.Gym({
            name,
            address,
            phoneNumber,
            ownerId,
        });
        await gym.save();
        // Update owner's gymId if owner was assigned
        if (ownerId) {
            await User_1.User.findByIdAndUpdate(ownerId, { gymId: gym.id });
        }
        // Return gym data
        const gymResponse = gym.toJSON();
        res.status(201).json({
            success: true,
            data: gymResponse,
            message: 'Gym created successfully',
        });
    }
    catch (error) {
        console.error('Error creating gym:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create gym',
        });
    }
};
exports.createGym = createGym;
/**
 * Update gym (admin only)
 */
const updateGym = async (req, res) => {
    try {
        const { id } = req.params;
        // Validate request body
        const validationResult = UpdateGymSchema.safeParse(req.body);
        if (!validationResult.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid update data',
                message: validationResult.error.errors.map(e => e.message).join(', '),
            });
            return;
        }
        const updateData = validationResult.data;
        // Find the gym to update
        const existingGym = await Gym_1.Gym.findById(id);
        if (!existingGym) {
            res.status(404).json({
                success: false,
                error: 'Gym not found',
            });
            return;
        }
        // Check if name is being updated and if it's already taken
        if (updateData.name && updateData.name !== existingGym.name) {
            const nameExists = await Gym_1.Gym.findOne({ name: updateData.name });
            if (nameExists) {
                res.status(409).json({
                    success: false,
                    error: 'Gym name is already in use',
                });
                return;
            }
        }
        // Handle owner change - update both old and new owner's gymId
        if (updateData.ownerId !== undefined) {
            // Remove gymId from old owner if there was one
            if (existingGym.ownerId) {
                await User_1.User.findByIdAndUpdate(existingGym.ownerId, { $unset: { gymId: 1 } });
            }
            // Set gymId for new owner
            if (updateData.ownerId) {
                await User_1.User.findByIdAndUpdate(updateData.ownerId, { gymId: id });
            }
        }
        // Update gym
        const updatedGym = await Gym_1.Gym.findByIdAndUpdate(id, updateData, { new: true, runValidators: true });
        if (!updatedGym) {
            res.status(404).json({
                success: false,
                error: 'Gym not found',
            });
            return;
        }
        res.json({
            success: true,
            data: updatedGym.toJSON(),
            message: 'Gym updated successfully',
        });
    }
    catch (error) {
        console.error('Error updating gym:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update gym',
        });
    }
};
exports.updateGym = updateGym;
/**
 * Delete gym (admin only)
 */
const deleteGym = async (req, res) => {
    try {
        const { id } = req.params;
        const gym = await Gym_1.Gym.findByIdAndDelete(id);
        if (!gym) {
            res.status(404).json({
                success: false,
                error: 'Gym not found',
            });
            return;
        }
        res.json({
            success: true,
            message: 'Gym deleted successfully',
        });
    }
    catch (error) {
        console.error('Error deleting gym:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete gym',
        });
    }
};
exports.deleteGym = deleteGym;
//# sourceMappingURL=gyms.js.map