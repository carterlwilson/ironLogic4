import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ClientDefaultSchedule } from '../models/ClientDefaultSchedule.js';
import { ScheduleTemplate } from '../models/ScheduleTemplate.js';
import { User } from '../models/User.js';
import { AdminAssignClientSchema, ApiResponse } from '@ironlogic4/shared';
import { z } from 'zod';

const IdParamSchema = z.object({ id: z.string().min(1) });
const ClientIdParamSchema = z.object({ id: z.string().min(1), clientId: z.string().min(1) });

export const getTemplateClients = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: templateId } = IdParamSchema.parse(req.params);
    const gymId = req.user?.gymId;

    const template = await ScheduleTemplate.findById(templateId);
    if (!template || template.gymId !== gymId) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    const defaults = await ClientDefaultSchedule.find({ templateId, isActive: true });
    const clientIds = defaults.map(d => d.clientId);
    const users = await User.find({ _id: { $in: clientIds } }).select('firstName lastName email');
    const userMap = new Map(users.map(u => [u.id, u]));

    const data = defaults.map(d => {
      const u = userMap.get(d.clientId);
      return {
        defaultId: d.id,
        clientId: d.clientId,
        firstName: u?.firstName ?? '',
        lastName: u?.lastName ?? '',
        email: u?.email ?? '',
      };
    });

    res.json({ success: true, data } satisfies ApiResponse<typeof data>);
  } catch (error) {
    console.error('Error fetching template clients:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch template clients' });
  }
};

export const assignClientToTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: templateId } = IdParamSchema.parse(req.params);
    const gymId = req.user?.gymId;

    const bodyValidation = AdminAssignClientSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid request data' });
      return;
    }
    const { clientId } = bodyValidation.data;

    const template = await ScheduleTemplate.findById(templateId);
    if (!template || template.gymId !== gymId) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    const activeCount = await ClientDefaultSchedule.countDocuments({ templateId, isActive: true });
    const existing = await ClientDefaultSchedule.findOne({ clientId, templateId });

    if (existing && existing.isActive) {
      res.status(400).json({ success: false, error: 'Client is already assigned to this template' });
      return;
    }

    // Only check capacity for new assignments (not reactivations that are already counted)
    const isReactivation = existing && !existing.isActive;
    if (!isReactivation && activeCount >= template.maxCapacity) {
      res.status(400).json({ success: false, error: 'Template is at capacity' });
      return;
    }

    if (isReactivation) {
      existing.isActive = true;
      await existing.save();
      res.json({ success: true, data: existing.toJSON(), message: 'Client assigned' } satisfies ApiResponse<any>);
      return;
    }

    const record = await ClientDefaultSchedule.create({ clientId, templateId, isActive: true });
    res.status(201).json({ success: true, data: record.toJSON(), message: 'Client assigned' } satisfies ApiResponse<any>);
  } catch (error) {
    console.error('Error assigning client to template:', error);
    res.status(500).json({ success: false, error: 'Failed to assign client' });
  }
};

export const removeClientFromTemplate = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id: templateId, clientId } = ClientIdParamSchema.parse(req.params);
    const gymId = req.user?.gymId;

    const template = await ScheduleTemplate.findById(templateId);
    if (!template || template.gymId !== gymId) {
      res.status(404).json({ success: false, error: 'Template not found' });
      return;
    }

    const record = await ClientDefaultSchedule.findOne({ clientId, templateId, isActive: true });
    if (!record) {
      res.status(404).json({ success: false, error: 'Assignment not found' });
      return;
    }

    record.isActive = false;
    await record.save();

    res.json({ success: true, message: 'Client removed' } satisfies ApiResponse<null>);
  } catch (error) {
    console.error('Error removing client from template:', error);
    res.status(500).json({ success: false, error: 'Failed to remove client' });
  }
};
