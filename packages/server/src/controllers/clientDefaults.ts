import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ClientDefaultSchedule } from '../models/ClientDefaultSchedule.js';
import { ScheduleTemplate } from '../models/ScheduleTemplate.js';
import { ApiResponse, ClientDefaultScheduleSchema } from '@ironlogic4/shared';
import { z } from 'zod';

const IdParamSchema = z.object({
  id: z.string().min(1),
});

/**
 * GET /defaults
 * Returns the authenticated client's active default schedule entries.
 */
export const getMyDefaults = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const clientId = req.user?.id;
    if (!clientId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const defaults = await ClientDefaultSchedule.find({ clientId, isActive: true });

    const response: ApiResponse<any> = { success: true, data: defaults.map(d => d.toJSON()) };
    res.json(response);
  } catch (error) {
    console.error('Error fetching client defaults:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch defaults' });
  }
};

/**
 * POST /defaults
 * Add a default schedule slot for the authenticated client.
 */
export const addDefault = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const bodyValidation = ClientDefaultScheduleSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid request data', details: bodyValidation.error.errors });
      return;
    }

    const { templateId } = bodyValidation.data;
    const clientId = req.user?.id;
    const gymId = req.user?.gymId;

    if (!clientId || !gymId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const template = await ScheduleTemplate.findById(templateId);
    if (!template) {
      res.status(404).json({ success: false, error: 'Schedule template not found' });
      return;
    }

    if (template.gymId !== gymId && req.user?.userType !== 'admin') {
      res.status(403).json({ success: false, error: 'Template does not belong to your gym' });
      return;
    }

    if (!template.isActive) {
      res.status(400).json({ success: false, error: 'Cannot set a default for an inactive template' });
      return;
    }

    // Upsert — reactivate if previously deactivated
    const existing = await ClientDefaultSchedule.findOne({ clientId, templateId });
    if (existing) {
      if (existing.isActive) {
        res.status(400).json({ success: false, error: 'Default already exists for this template' });
        return;
      }
      existing.isActive = true;
      await existing.save();
      const response: ApiResponse<any> = { success: true, data: existing.toJSON(), message: 'Default restored' };
      res.json(response);
      return;
    }

    const newDefault = await ClientDefaultSchedule.create({ clientId, templateId, isActive: true });

    const response: ApiResponse<any> = { success: true, data: newDefault.toJSON(), message: 'Default added' };
    res.status(201).json(response);
  } catch (error) {
    console.error('Error adding client default:', error);
    res.status(500).json({ success: false, error: 'Failed to add default' });
  }
};

/**
 * DELETE /defaults/:id
 * Deactivates (soft-deletes) a client default schedule entry.
 */
export const removeDefault = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramValidation = IdParamSchema.safeParse(req.params);
    if (!paramValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid ID' });
      return;
    }

    const { id } = paramValidation.data;
    const clientId = req.user?.id;

    if (!clientId) {
      res.status(401).json({ success: false, error: 'Authentication required' });
      return;
    }

    const record = await ClientDefaultSchedule.findById(id);
    if (!record) {
      res.status(404).json({ success: false, error: 'Default not found' });
      return;
    }

    if (record.clientId !== clientId && !['admin', 'owner'].includes(req.user?.userType ?? '')) {
      res.status(403).json({ success: false, error: 'Access denied' });
      return;
    }

    record.isActive = false;
    await record.save();

    const response: ApiResponse<null> = { success: true, message: 'Default removed' };
    res.json(response);
  } catch (error) {
    console.error('Error removing client default:', error);
    res.status(500).json({ success: false, error: 'Failed to remove default' });
  }
};
