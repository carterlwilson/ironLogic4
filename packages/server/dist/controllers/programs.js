"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProgram = exports.updateProgram = exports.createProgram = exports.getProgramById = exports.getAllPrograms = void 0;
const Program_1 = require("../models/Program");
const shared_1 = require("@ironlogic4/shared");
/**
 * Get all programs with pagination and filtering
 */
const getAllPrograms = async (req, res) => {
    try {
        const validation = shared_1.ProgramListParamsSchema.safeParse(req.query);
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
            Program_1.Program.find(query)
                .populate('gymId', 'name')
                .populate('createdBy', 'firstName lastName')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            Program_1.Program.countDocuments(query),
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
exports.getAllPrograms = getAllPrograms;
/**
 * Get program by ID
 */
const getProgramById = async (req, res) => {
    try {
        const validation = shared_1.ProgramIdSchema.safeParse(req.params);
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
        const program = await Program_1.Program.findOne(query)
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
exports.getProgramById = getProgramById;
/**
 * Create new program
 */
const createProgram = async (req, res) => {
    try {
        const validation = shared_1.CreateProgramSchema.safeParse(req.body);
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
        const newProgram = new Program_1.Program({
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
exports.createProgram = createProgram;
/**
 * Update program by ID
 */
const updateProgram = async (req, res) => {
    try {
        const paramsValidation = shared_1.ProgramIdSchema.safeParse(req.params);
        const bodyValidation = shared_1.UpdateProgramSchema.safeParse(req.body);
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
            const existingProgram = await Program_1.Program.findOne(query);
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
        const updatedProgram = await Program_1.Program.findOneAndUpdate(query, updateData, { new: true, runValidators: true })
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
exports.updateProgram = updateProgram;
/**
 * Delete program by ID (soft delete - sets isActive to false)
 */
const deleteProgram = async (req, res) => {
    try {
        const validation = shared_1.ProgramIdSchema.safeParse(req.params);
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
        const program = await Program_1.Program.findOneAndUpdate(query, { isActive: false }, { new: true });
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
exports.deleteProgram = deleteProgram;
//# sourceMappingURL=programs.js.map