import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { BenchmarkTemplate } from '../models/BenchmarkTemplate';
import {
  UserType,
  ApiResponse,
  PaginatedResponse,
  CreateBenchmarkTemplateSchema,
  UpdateBenchmarkTemplateSchema,
  BenchmarkTemplateListParamsSchema,
  BenchmarkTemplateIdSchema,
} from '@ironlogic4/shared';

/**
 * Get all benchmark templates with pagination, search, and filtering
 */
export const getAllBenchmarkTemplates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = BenchmarkTemplateListParamsSchema.safeParse(req.query);

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

    const query: any = {};

    // Gym scoping: owners can only see their gym's templates, admins can filter by gymId
    if (req.user?.userType === UserType.OWNER) {
      query.gymId = req.user.gymId;
    } else if (gymId) {
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
      BenchmarkTemplate.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BenchmarkTemplate.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<any> = {
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
  } catch (error) {
    console.error('Error fetching benchmark templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benchmark templates',
    });
  }
};

/**
 * Get a single benchmark template by ID
 */
export const getBenchmarkTemplateById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = BenchmarkTemplateIdSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid benchmark template ID',
      });
      return;
    }

    const { id } = validation.data;

    const template = await BenchmarkTemplate.findById(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Benchmark template not found',
      });
      return;
    }

    // Gym scoping: owners can only access their gym's templates
    if (req.user?.userType === UserType.OWNER && template.gymId !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own gym\'s templates.',
      });
      return;
    }

    const response: ApiResponse<any> = {
      success: true,
      data: template.toJSON(),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching benchmark template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benchmark template',
    });
  }
};

/**
 * Create a new benchmark template
 */
export const createBenchmarkTemplate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = CreateBenchmarkTemplateSchema.safeParse(req.body);

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
    const existingTemplate = await BenchmarkTemplate.findOne({
      name,
      gymId: req.user!.gymId,
    });

    if (existingTemplate) {
      res.status(409).json({
        success: false,
        error: 'A benchmark template with this name already exists in your gym',
      });
      return;
    }

    // Create the template - auto-set gymId and createdBy from authenticated user
    const newTemplate = new BenchmarkTemplate({
      name,
      notes,
      type,
      tags,
      gymId: req.user!.gymId,
      createdBy: req.user!.id,
    });

    const savedTemplate = await newTemplate.save();

    const response: ApiResponse<any> = {
      success: true,
      data: savedTemplate.toJSON(),
      message: 'Benchmark template created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating benchmark template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create benchmark template',
    });
  }
};

/**
 * Update a benchmark template
 */
export const updateBenchmarkTemplate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramsValidation = BenchmarkTemplateIdSchema.safeParse(req.params);
    const bodyValidation = UpdateBenchmarkTemplateSchema.safeParse(req.body);

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

    const template = await BenchmarkTemplate.findById(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Benchmark template not found',
      });
      return;
    }

    // Gym scoping: owners can only update their gym's templates
    if (req.user?.userType === UserType.OWNER && template.gymId !== req.user.gymId) {
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

    const updatedTemplate = await BenchmarkTemplate.findByIdAndUpdate(
      id,
      sanitizedUpdateData,
      { new: true, runValidators: true }
    );

    const response: ApiResponse<any> = {
      success: true,
      data: updatedTemplate ? updatedTemplate.toJSON() : null,
      message: 'Benchmark template updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating benchmark template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update benchmark template',
    });
  }
};

/**
 * Delete a benchmark template
 */
export const deleteBenchmarkTemplate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = BenchmarkTemplateIdSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid benchmark template ID',
      });
      return;
    }

    const { id } = validation.data;

    const template = await BenchmarkTemplate.findById(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Benchmark template not found',
      });
      return;
    }

    // Gym scoping: owners can only delete their gym's templates
    if (req.user?.userType === UserType.OWNER && template.gymId !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own gym\'s templates.',
      });
      return;
    }

    await BenchmarkTemplate.findByIdAndDelete(id);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Benchmark template deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting benchmark template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete benchmark template',
    });
  }
};