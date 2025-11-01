"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBenchmarkTemplate = exports.updateBenchmarkTemplate = exports.createBenchmarkTemplate = exports.getBenchmarkTemplateById = exports.getAllBenchmarkTemplates = void 0;
const BenchmarkTemplate_1 = require("../models/BenchmarkTemplate");
const shared_1 = require("@ironlogic4/shared");
/**
 * Get all benchmark templates with pagination, search, and filtering
 */
const getAllBenchmarkTemplates = async (req, res) => {
    try {
        const validation = shared_1.BenchmarkTemplateListParamsSchema.safeParse(req.query);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid query parameters',
                details: validation.error.errors,
            });
            return;
        }
        const { gymId, search, type, tags, page, limit } = validation.data;
        const skip = (page - 1) * limit;
        const query = {};
        // Gym scoping: owners can only see their gym's templates, admins can filter by gymId
        if (req.user?.userType === shared_1.UserType.OWNER) {
            query.gymId = req.user.gymId;
        }
        else if (gymId) {
            query.gymId = gymId;
        }
        // Text search on name and notes
        if (search) {
            query.$text = { $search: search };
        }
        // Filter by type
        if (type) {
            query.type = type;
        }
        // Filter by tags (comma-separated)
        if (tags) {
            const tagsArray = tags.split(',').map(tag => tag.trim());
            query.tags = { $in: tagsArray };
        }
        const [templates, total] = await Promise.all([
            BenchmarkTemplate_1.BenchmarkTemplate.find(query)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit),
            BenchmarkTemplate_1.BenchmarkTemplate.countDocuments(query),
        ]);
        const totalPages = Math.ceil(total / limit);
        const response = {
            success: true,
            data: templates.map(t => t.toJSON()),
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
        console.error('Error fetching benchmark templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch benchmark templates',
        });
    }
};
exports.getAllBenchmarkTemplates = getAllBenchmarkTemplates;
/**
 * Get a single benchmark template by ID
 */
const getBenchmarkTemplateById = async (req, res) => {
    try {
        const validation = shared_1.BenchmarkTemplateIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid benchmark template ID',
            });
            return;
        }
        const { id } = validation.data;
        const template = await BenchmarkTemplate_1.BenchmarkTemplate.findById(id);
        if (!template) {
            res.status(404).json({
                success: false,
                error: 'Benchmark template not found',
            });
            return;
        }
        // Gym scoping: owners can only access their gym's templates
        if (req.user?.userType === shared_1.UserType.OWNER && template.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own gym\'s templates.',
            });
            return;
        }
        const response = {
            success: true,
            data: template.toJSON(),
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching benchmark template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch benchmark template',
        });
    }
};
exports.getBenchmarkTemplateById = getBenchmarkTemplateById;
/**
 * Create a new benchmark template
 */
const createBenchmarkTemplate = async (req, res) => {
    try {
        const validation = shared_1.CreateBenchmarkTemplateSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid benchmark template data',
                details: validation.error.errors,
            });
            return;
        }
        const { name, notes, type, tags } = validation.data;
        // Check if template with same name already exists in gym (optional duplicate check)
        const existingTemplate = await BenchmarkTemplate_1.BenchmarkTemplate.findOne({
            name,
            gymId: req.user.gymId,
        });
        if (existingTemplate) {
            res.status(409).json({
                success: false,
                error: 'A benchmark template with this name already exists in your gym',
            });
            return;
        }
        // Create the template - auto-set gymId and createdBy from authenticated user
        const newTemplate = new BenchmarkTemplate_1.BenchmarkTemplate({
            name,
            notes,
            type,
            tags,
            gymId: req.user.gymId,
            createdBy: req.user.id,
        });
        const savedTemplate = await newTemplate.save();
        const response = {
            success: true,
            data: savedTemplate.toJSON(),
            message: 'Benchmark template created successfully',
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating benchmark template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create benchmark template',
        });
    }
};
exports.createBenchmarkTemplate = createBenchmarkTemplate;
/**
 * Update a benchmark template
 */
const updateBenchmarkTemplate = async (req, res) => {
    try {
        const paramsValidation = shared_1.BenchmarkTemplateIdSchema.safeParse(req.params);
        const bodyValidation = shared_1.UpdateBenchmarkTemplateSchema.safeParse(req.body);
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
        const template = await BenchmarkTemplate_1.BenchmarkTemplate.findById(id);
        if (!template) {
            res.status(404).json({
                success: false,
                error: 'Benchmark template not found',
            });
            return;
        }
        // Gym scoping: owners can only update their gym's templates
        if (req.user?.userType === shared_1.UserType.OWNER && template.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only update your own gym\'s templates.',
            });
            return;
        }
        // Field sanitization - strip protected fields
        const sanitizedUpdateData = {
            ...validatedData,
            gymId: undefined, // Never allow changing gym
            createdBy: undefined, // Never allow changing creator
        };
        const updatedTemplate = await BenchmarkTemplate_1.BenchmarkTemplate.findByIdAndUpdate(id, sanitizedUpdateData, { new: true, runValidators: true });
        const response = {
            success: true,
            data: updatedTemplate ? updatedTemplate.toJSON() : null,
            message: 'Benchmark template updated successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating benchmark template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to update benchmark template',
        });
    }
};
exports.updateBenchmarkTemplate = updateBenchmarkTemplate;
/**
 * Delete a benchmark template
 */
const deleteBenchmarkTemplate = async (req, res) => {
    try {
        const validation = shared_1.BenchmarkTemplateIdSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid benchmark template ID',
            });
            return;
        }
        const { id } = validation.data;
        const template = await BenchmarkTemplate_1.BenchmarkTemplate.findById(id);
        if (!template) {
            res.status(404).json({
                success: false,
                error: 'Benchmark template not found',
            });
            return;
        }
        // Gym scoping: owners can only delete their gym's templates
        if (req.user?.userType === shared_1.UserType.OWNER && template.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only delete your own gym\'s templates.',
            });
            return;
        }
        await BenchmarkTemplate_1.BenchmarkTemplate.findByIdAndDelete(id);
        const response = {
            success: true,
            message: 'Benchmark template deleted successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting benchmark template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete benchmark template',
        });
    }
};
exports.deleteBenchmarkTemplate = deleteBenchmarkTemplate;
//# sourceMappingURL=benchmarkTemplates.js.map