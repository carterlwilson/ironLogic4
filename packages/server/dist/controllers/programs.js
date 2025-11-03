import { Program } from '../models/Program.js';
import { CreateProgramSchema, UpdateProgramSchema, ProgramListParamsSchema, ProgramIdSchema } from '@ironlogic4/shared';
/**
 * Get all programs with pagination and filtering
 */
export const getAllPrograms = async (req, res) => {
    try {
        const validation = ProgramListParamsSchema.safeParse(req.query);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: validation.error.errors,
            });
            return;
        }
        const { gymId, isActive, createdBy, search, page, limit } = validation.data;
        const skip = (page - 1) * limit;
        // Build query
        const query = {};
        // Gym filtering - required for owners, optional for admins
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        else if (gymId) {
            query.gymId = gymId;
        }
        // Filter by isActive
        if (isActive !== undefined) {
            query.isActive = isActive;
        }
        // Filter by createdBy
        if (createdBy) {
            query.createdBy = createdBy;
        }
        // Text search on name
        if (search) {
            query.name = { $regex: search, $options: 'i' };
        }
        // Get programs and total count
        const [programs, total] = await Promise.all([
            Program.find(query)
                .populate('gymId', 'name')
                .populate('createdBy', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Program.countDocuments(query),
        ]);
        const totalPages = Math.ceil(total / limit);
        const response = {
            success: true,
            data: programs.map(program => program.toJSON()),
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
        console.error('Error fetching programs:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch programs',
        });
    }
};
/**
 * Get program by ID
 */
export const getProgramById = async (req, res) => {
    try {
        const validation = ProgramIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid program ID',
            });
            return;
        }
        const { id } = validation.data;
        // Build query with gym scoping for owners
        const query = { _id: id };
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        const program = await Program.findOne(query)
            .populate('gymId', 'name')
            .populate('createdBy', 'firstName lastName');
        if (!program) {
            res.status(404).json({
                success: false,
                error: 'Program not found',
            });
            return;
        }
        const response = {
            success: true,
            data: program.toJSON(),
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch program',
        });
    }
};
/**
 * Create new program
 */
export const createProgram = async (req, res) => {
    try {
        const validation = CreateProgramSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid program data',
                details: validation.error.errors,
            });
            return;
        }
        const programData = validation.data;
        // For owners, ensure they can only create programs for their own gym
        if (req.user?.userType === 'owner') {
            if (programData.gymId !== req.user.gymId) {
                res.status(403).json({
                    success: false,
                    error: 'You can only create programs for your own gym',
                });
                return;
            }
        }
        const newProgram = new Program({
            ...programData,
            createdBy: req.user.id,
            isActive: true,
            blocks: [],
        });
        const savedProgram = await newProgram.save();
        await savedProgram.populate('gymId', 'name');
        await savedProgram.populate('createdBy', 'firstName lastName');
        const response = {
            success: true,
            data: savedProgram.toJSON(),
            message: 'Program created successfully',
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create program',
        });
    }
};
/**
 * Update program by ID
 */
export const updateProgram = async (req, res) => {
    try {
        const paramsValidation = ProgramIdSchema.safeParse(req.params);
        const bodyValidation = UpdateProgramSchema.safeParse(req.body);
        if (!paramsValidation.success || !bodyValidation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
                details: [...(paramsValidation.error?.errors || []), ...(bodyValidation.error?.errors || [])],
            });
            return;
        }
        const { id } = paramsValidation.data;
        const updateData = bodyValidation.data;
        // Build query with gym scoping for owners
        const query = { _id: id };
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        // If blocks are being updated, check if program has been started
        if (updateData.blocks) {
            const existingProgram = await Program.findOne(query);
            if (!existingProgram) {
                res.status(404).json({
                    success: false,
                    error: 'Program not found',
                });
                return;
            }
            // Prevent structure changes if program has been started
            if (existingProgram.currentProgress.startedAt !== null) {
                res.status(400).json({
                    success: false,
                    error: 'Cannot modify block/week structure of a program that has been started. Please reset progress first.',
                });
                return;
            }
        }
        const updatedProgram = await Program.findOneAndUpdate(query, updateData, { new: true, runValidators: true })
            .populate('gymId', 'name')
            .populate('createdBy', 'firstName lastName');
        if (!updatedProgram) {
            res.status(404).json({
                success: false,
                error: 'Program not found',
            });
            return;
        }
        const response = {
            success: true,
            data: updatedProgram.toJSON(),
            message: 'Program updated successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update program',
        });
    }
};
/**
 * Delete program by ID (soft delete - sets isActive to false)
 */
export const deleteProgram = async (req, res) => {
    try {
        const validation = ProgramIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid program ID',
            });
            return;
        }
        const { id } = validation.data;
        // Build query with gym scoping for owners
        const query = { _id: id };
        if (req.user?.userType === 'owner') {
            query.gymId = req.user.gymId;
        }
        const program = await Program.findOneAndUpdate(query, { isActive: false }, { new: true });
        if (!program) {
            res.status(404).json({
                success: false,
                error: 'Program not found',
            });
            return;
        }
        const response = {
            success: true,
            message: 'Program deleted successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting program:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete program',
        });
    }
};
//# sourceMappingURL=programs.js.map