import { ScheduleTemplate } from '../models/ScheduleTemplate.js';
import { ActiveSchedule } from '../models/ActiveSchedule.js';
import { User } from '../models/User.js';
import { CreateScheduleTemplateSchema, UpdateScheduleTemplateSchema, UserType, } from '@ironlogic4/shared';
import { z } from 'zod';
const IdParamSchema = z.object({
    id: z.string().min(1),
});
/**
 * Validate that coach IDs exist, belong to the gym, and have appropriate roles
 */
async function validateCoachIds(coachIds, gymId) {
    const coaches = await User.find({
        _id: { $in: coachIds },
    });
    if (coaches.length !== coachIds.length) {
        return { valid: false, error: 'One or more coach IDs not found' };
    }
    // Check that all users belong to the gym
    const invalidGym = coaches.find(coach => coach.gymId !== gymId);
    if (invalidGym) {
        return { valid: false, error: 'All coaches must belong to the same gym' };
    }
    // Check that all users have appropriate roles
    const invalidRole = coaches.find(coach => !['coach', 'admin', 'owner'].includes(coach.userType));
    if (invalidRole) {
        return { valid: false, error: 'Coach IDs must refer to users with coach, admin, or owner roles' };
    }
    return { valid: true };
}
/**
 * Get all schedule templates with filtering
 */
export const getScheduleTemplates = async (req, res) => {
    try {
        const { gymId, coachId } = req.query;
        const query = {};
        // Gym filtering - required for owners, optional for admins
        if (req.user?.userType === UserType.OWNER) {
            query.gymId = req.user.gymId;
        }
        else if (gymId) {
            query.gymId = gymId;
        }
        // Coach filtering - coaches can only see schedules they're assigned to
        if (req.user?.userType === UserType.COACH || coachId) {
            const filterCoachId = coachId || req.user?.id;
            query.coachIds = filterCoachId;
        }
        const templates = await ScheduleTemplate.find(query)
            .populate('gymId', 'name')
            .populate('createdBy', 'firstName lastName')
            .sort({ createdAt: -1 });
        const response = {
            success: true,
            data: templates.map(template => template.toJSON()),
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching schedule templates:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch schedule templates',
        });
    }
};
/**
 * Get schedule template by ID
 */
export const getScheduleTemplateById = async (req, res) => {
    try {
        const validation = IdParamSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid schedule template ID',
            });
            return;
        }
        const { id } = validation.data;
        const template = await ScheduleTemplate.findById(id);
        if (!template) {
            res.status(404).json({
                success: false,
                error: 'Schedule template not found',
            });
            return;
        }
        // Check access permissions
        if (req.user?.userType === UserType.OWNER && template.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own gym\'s schedules.',
            });
            return;
        }
        // Coaches can only view schedules they're assigned to
        if (req.user?.userType === UserType.COACH) {
            const isAssigned = template.coachIds.includes(req.user.id);
            if (!isAssigned) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied. You can only view schedules you are assigned to.',
                });
                return;
            }
        }
        // Populate after access checks
        await template.populate('gymId', 'name');
        await template.populate('createdBy', 'firstName lastName');
        const response = {
            success: true,
            data: template.toJSON(),
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching schedule template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch schedule template',
        });
    }
};
/**
 * Create new schedule template
 */
export const createScheduleTemplate = async (req, res) => {
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
        const templateData = validation.data;
        // If no days provided, initialize with all 7 days (empty timeslots)
        let days = templateData.days;
        if (!days || days.length === 0) {
            days = [
                { dayOfWeek: 0, timeSlots: [] }, // Sunday
                { dayOfWeek: 1, timeSlots: [] }, // Monday
                { dayOfWeek: 2, timeSlots: [] }, // Tuesday
                { dayOfWeek: 3, timeSlots: [] }, // Wednesday
                { dayOfWeek: 4, timeSlots: [] }, // Thursday
                { dayOfWeek: 5, timeSlots: [] }, // Friday
                { dayOfWeek: 6, timeSlots: [] }, // Saturday
            ];
        }
        // Determine gymId based on user type
        // For OWNER/CLIENT, always use their gym. For ADMIN, allow specifying gymId
        let gymId;
        if (req.user?.userType === UserType.OWNER || req.user?.userType === UserType.CLIENT) {
            if (!req.user.gymId) {
                res.status(400).json({
                    success: false,
                    error: 'You must be assigned to a gym to create templates',
                });
                return;
            }
            gymId = req.user.gymId;
        }
        else {
            // Admin can specify gymId in request body
            gymId = req.body.gymId;
            if (!gymId) {
                res.status(400).json({
                    success: false,
                    error: 'Gym ID is required',
                });
                return;
            }
        }
        // Validate coach IDs
        const coachValidation = await validateCoachIds(templateData.coachIds, gymId);
        if (!coachValidation.valid) {
            res.status(400).json({
                success: false,
                error: coachValidation.error,
            });
            return;
        }
        const newTemplate = new ScheduleTemplate({
            name: templateData.name,
            description: templateData.description,
            coachIds: templateData.coachIds,
            days,
            gymId,
            createdBy: req.user.id,
        });
        const savedTemplate = await newTemplate.save();
        await savedTemplate.populate('gymId', 'name');
        await savedTemplate.populate('createdBy', 'firstName lastName');
        const response = {
            success: true,
            data: savedTemplate.toJSON(),
            message: 'Schedule template created successfully',
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating schedule template:', error);
        // Handle duplicate name error
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                error: 'A schedule template with this name already exists for this gym',
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to create schedule template',
        });
    }
};
/**
 * Update schedule template by ID
 */
export const updateScheduleTemplate = async (req, res) => {
    try {
        const paramsValidation = IdParamSchema.safeParse(req.params);
        const bodyValidation = UpdateScheduleTemplateSchema.safeParse(req.body);
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
        const template = await ScheduleTemplate.findById(id);
        if (!template) {
            res.status(404).json({
                success: false,
                error: 'Schedule template not found',
            });
            return;
        }
        // Check access permissions
        if (req.user?.userType === UserType.OWNER && template.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only update your own gym\'s templates.',
            });
            return;
        }
        // If updating coach IDs, validate them
        if (updateData.coachIds) {
            const coachValidation = await validateCoachIds(updateData.coachIds, template.gymId);
            if (!coachValidation.valid) {
                res.status(400).json({
                    success: false,
                    error: coachValidation.error,
                });
                return;
            }
        }
        const updatedTemplate = await ScheduleTemplate.findByIdAndUpdate(id, updateData, { new: true, runValidators: true })
            .populate('gymId', 'name')
            .populate('createdBy', 'firstName lastName');
        const response = {
            success: true,
            data: updatedTemplate ? updatedTemplate.toJSON() : null,
            message: 'Schedule template updated successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error updating schedule template:', error);
        // Handle duplicate name error
        if (error.code === 11000) {
            res.status(400).json({
                success: false,
                error: 'A schedule template with this name already exists for this gym',
            });
            return;
        }
        res.status(500).json({
            success: false,
            error: 'Failed to update schedule template',
        });
    }
};
/**
 * Delete schedule template by ID
 */
export const deleteScheduleTemplate = async (req, res) => {
    try {
        const validation = IdParamSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid schedule template ID',
            });
            return;
        }
        const { id } = validation.data;
        const template = await ScheduleTemplate.findById(id);
        if (!template) {
            res.status(404).json({
                success: false,
                error: 'Schedule template not found',
            });
            return;
        }
        // Check access permissions
        if (req.user?.userType === UserType.OWNER && template.gymId !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only delete your own gym\'s templates.',
            });
            return;
        }
        // Check if there's an active schedule using this template
        const activeSchedule = await ActiveSchedule.findOne({ templateId: id });
        if (activeSchedule) {
            res.status(400).json({
                success: false,
                error: 'Cannot delete template with an active schedule. Delete the active schedule first.',
            });
            return;
        }
        await ScheduleTemplate.findByIdAndDelete(id);
        const response = {
            success: true,
            message: 'Schedule template deleted successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting schedule template:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete schedule template',
        });
    }
};
//# sourceMappingURL=scheduleTemplates.js.map