import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { ActivityTemplate } from '../models/ActivityTemplate';
import { ApiResponse, PaginatedResponse, ActivityTemplateListParams, CreateActivityTemplateSchema, UpdateActivityTemplateSchema, ActivityTemplateListParamsSchema, ActivityTemplateIdSchema } from '@ironlogic4/shared';

/**
 * Get all activity templates with pagination and filtering
 */
export const getAllActivityTemplates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = ActivityTemplateListParamsSchema.safeParse(req.query);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: validation.error.errors,
      });
      return;
    }

    const { gymId, type, groupId, search, page, limit } = validation.data;
    const skip = (page - 1) * limit;

    // Build query
    const query: any = {};

    // Gym filtering - required for owners, optional for admins
    if (req.user?.userType === 'owner') {
      query.gymId = req.user.gymId;
    } else if (gymId) {
      query.gymId = gymId;
    }

    if (type) {
      query.type = type;
    }

    if (groupId) {
      query.groupId = groupId;
    }

    if (search) {
      query.$text = { $search: search };
    }

    // Get templates and total count
    const [templates, total] = await Promise.all([
      ActivityTemplate.find(query)
        .populate('gymId', 'name')
        .populate('createdBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      ActivityTemplate.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    const response: PaginatedResponse<any> = {
      success: true,
      data: templates,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching activity templates:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity templates',
    });
  }
};

/**
 * Get activity template by ID
 */
export const getActivityTemplateById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = ActivityTemplateIdSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid activity template ID',
      });
      return;
    }

    const { id } = validation.data;

    const template = await ActivityTemplate.findById(id)
      .populate('gymId', 'name')
      .populate('createdBy', 'firstName lastName');

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Activity template not found',
      });
      return;
    }

    // Check access permissions
    if (req.user?.userType === 'owner' && template.gymId.toString() !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own gym\'s templates.',
      });
      return;
    }

    const response: ApiResponse<typeof template> = {
      success: true,
      data: template,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching activity template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activity template',
    });
  }
};

/**
 * Create new activity template
 */
export const createActivityTemplate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = CreateActivityTemplateSchema.safeParse(req.body);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid activity template data',
        details: validation.error.errors,
      });
      return;
    }

    const templateData = validation.data;

    // For owners, ensure they can only create templates for their own gym
    if (req.user?.userType === 'owner') {
      if (templateData.gymId !== req.user.gymId) {
        res.status(403).json({
          success: false,
          error: 'You can only create templates for your own gym',
        });
        return;
      }
    }

    const newTemplate = new ActivityTemplate({
      ...templateData,
      createdBy: req.user!.id,
    });

    const savedTemplate = await newTemplate.save();
    await savedTemplate.populate('gymId', 'name');
    await savedTemplate.populate('createdBy', 'firstName lastName');

    const response: ApiResponse<typeof savedTemplate> = {
      success: true,
      data: savedTemplate,
      message: 'Activity template created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating activity template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create activity template',
    });
  }
};

/**
 * Update activity template by ID
 */
export const updateActivityTemplate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramsValidation = ActivityTemplateIdSchema.safeParse(req.params);
    const bodyValidation = UpdateActivityTemplateSchema.safeParse(req.body);

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

    const template = await ActivityTemplate.findById(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Activity template not found',
      });
      return;
    }

    // Check access permissions
    if (req.user?.userType === 'owner' && template.gymId.toString() !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only update your own gym\'s templates.',
      });
      return;
    }

    const updatedTemplate = await ActivityTemplate.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('gymId', 'name')
      .populate('createdBy', 'firstName lastName');

    const response: ApiResponse<typeof updatedTemplate> = {
      success: true,
      data: updatedTemplate,
      message: 'Activity template updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating activity template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update activity template',
    });
  }
};

/**
 * Delete activity template by ID
 */
export const deleteActivityTemplate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = ActivityTemplateIdSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid activity template ID',
      });
      return;
    }

    const { id } = validation.data;

    const template = await ActivityTemplate.findById(id);

    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Activity template not found',
      });
      return;
    }

    // Check access permissions
    if (req.user?.userType === 'owner' && template.gymId.toString() !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own gym\'s templates.',
      });
      return;
    }

    await ActivityTemplate.findByIdAndDelete(id);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Activity template deleted successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error deleting activity template:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete activity template',
    });
  }
};