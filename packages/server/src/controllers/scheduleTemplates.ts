import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ScheduleTemplate } from '../models/ScheduleTemplate.js';
import { ClassSession } from '../models/ClassSession.js';
import { User } from '../models/User.js';
import {
  ApiResponse,
  CreateScheduleTemplateSchema,
  UpdateScheduleTemplateSchema,
  UserType,
} from '@ironlogic4/shared';
import { z } from 'zod';

const IdParamSchema = z.object({
  id: z.string().min(1),
});

/**
 * Validate that a coachId exists, belongs to the gym, and has an appropriate role.
 */
async function validateCoachId(coachId: string, gymId: string): Promise<{ valid: boolean; error?: string }> {
  const coach = await User.findById(coachId);
  if (!coach) return { valid: false, error: 'Coach not found' };
  if (coach.gymId !== gymId) return { valid: false, error: 'Coach does not belong to this gym' };
  if (!['coach', 'admin', 'owner'].includes(coach.userType)) {
    return { valid: false, error: 'User must have a coach, admin, or owner role' };
  }
  return { valid: true };
}

/**
 * GET /templates
 * List all schedule templates for the current gym.
 */
export const getScheduleTemplates = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const query: any = {};

    if (req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) {
      query.gymId = req.user.gymId;
    } else if (req.query.gymId) {
      query.gymId = req.query.gymId;
    }

    const templates = await ScheduleTemplate.find(query).sort({ dayOfWeek: 1, time: 1 });

    const response: ApiResponse<any> = {
      success: true,
      data: templates.map(t => t.toJSON()),
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching schedule templates:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch schedule templates' });
  }
};

/**
 * GET /templates/:id
 * Get a single schedule template by ID.
 */
export const getScheduleTemplateById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = IdParamSchema.safeParse(req.params);
    if (!validation.success) {
      res.status(400).json({ success: false, error: 'Invalid schedule template ID' });
      return;
    }

    const template = await ScheduleTemplate.findById(validation.data.id);
    if (!template) {
      res.status(404).json({ success: false, error: 'Schedule template not found' });
      return;
    }

    if (
      (req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) &&
      template.gymId !== req.user.gymId
    ) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    res.json({ success: true, data: template.toJSON() });
  } catch (error) {
    console.error('Error fetching schedule template:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch schedule template' });
  }
};

/**
 * POST /templates
 * Create a new schedule template (flat model: one recurring class slot).
 */
export const createScheduleTemplate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = CreateScheduleTemplateSchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid schedule template data',
        details: validation.error.errors,
      });
      return;
    }

    let gymId: string | undefined;
    if (req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) {
      if (!req.user.gymId) {
        res.status(400).json({ success: false, error: 'You must be assigned to a gym' });
        return;
      }
      gymId = req.user.gymId;
    } else {
      gymId = req.body.gymId;
      if (!gymId) {
        res.status(400).json({ success: false, error: 'gymId is required' });
        return;
      }
    }

    const coachValidation = await validateCoachId(validation.data.coachId, gymId);
    if (!coachValidation.valid) {
      res.status(400).json({ success: false, error: coachValidation.error });
      return;
    }

    const template = await ScheduleTemplate.create({
      ...validation.data,
      gymId,
      isActive: true,
    });

    res.status(201).json({
      success: true,
      data: template.toJSON(),
      message: 'Schedule template created successfully',
    });
  } catch (error) {
    console.error('Error creating schedule template:', error);
    res.status(500).json({ success: false, error: 'Failed to create schedule template' });
  }
};

/**
 * PUT /templates/:id
 * Update a schedule template. Changes do NOT retroactively update already-generated sessions.
 */
export const updateScheduleTemplate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramsValidation = IdParamSchema.safeParse(req.params);
    const bodyValidation = UpdateScheduleTemplateSchema.safeParse(req.body);

    if (!paramsValidation.success || !bodyValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid request data' });
      return;
    }

    const template = await ScheduleTemplate.findById(paramsValidation.data.id);
    if (!template) {
      res.status(404).json({ success: false, error: 'Schedule template not found' });
      return;
    }

    if (
      (req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) &&
      template.gymId !== req.user.gymId
    ) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    if (bodyValidation.data.coachId) {
      const coachValidation = await validateCoachId(bodyValidation.data.coachId, template.gymId);
      if (!coachValidation.valid) {
        res.status(400).json({ success: false, error: coachValidation.error });
        return;
      }
    }

    const updated = await ScheduleTemplate.findByIdAndUpdate(
      paramsValidation.data.id,
      bodyValidation.data,
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      data: updated?.toJSON(),
      message: 'Schedule template updated successfully',
    });
  } catch (error) {
    console.error('Error updating schedule template:', error);
    res.status(500).json({ success: false, error: 'Failed to update schedule template' });
  }
};

/**
 * DELETE /templates/:id
 * Hard delete a template. Blocked if any ClassSessions exist for this template.
 */
export const deleteScheduleTemplate = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = IdParamSchema.safeParse(req.params);
    if (!validation.success) {
      res.status(400).json({ success: false, error: 'Invalid schedule template ID' });
      return;
    }

    const template = await ScheduleTemplate.findById(validation.data.id);
    if (!template) {
      res.status(404).json({ success: false, error: 'Schedule template not found' });
      return;
    }

    if (
      (req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) &&
      template.gymId !== req.user.gymId
    ) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    const sessionCount = await ClassSession.countDocuments({ templateId: validation.data.id });
    if (sessionCount > 0) {
      res.status(400).json({
        success: false,
        error: 'Cannot delete a template that has generated sessions. Deactivate it instead.',
      });
      return;
    }

    await ScheduleTemplate.findByIdAndDelete(validation.data.id);
    res.json({ success: true, message: 'Schedule template deleted successfully' });
  } catch (error) {
    console.error('Error deleting schedule template:', error);
    res.status(500).json({ success: false, error: 'Failed to delete schedule template' });
  }
};
