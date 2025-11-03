import { ActiveSchedule } from '../models/ActiveSchedule.js';
import { ScheduleTemplate } from '../models/ScheduleTemplate.js';
import { User } from '../models/User.js';
import { CreateActiveScheduleSchema, AssignStaffSchema, UserType, } from '@ironlogic4/shared';
import { z } from 'zod';
const IdParamSchema = z.object({
    id: z.string().min(1),
});
const TimeslotParamSchema = z.object({
    id: z.string().min(1),
    timeslotId: z.string().min(1),
});
const UnassignStaffParamSchema = z.object({
    id: z.string().min(1),
    timeslotId: z.string().min(1),
    coachId: z.string().min(1),
});
/**
 * Get all active schedules with filtering
 */
export const getActiveSchedules = async (req, res) => {
    try {
        const { gymId, coachId } = req.query;
        const query = {};
        // Gym filtering - required for owners and clients, optional for admins
        if (req.user?.userType === UserType.OWNER) {
            query.gymId = req.user.gymId;
        }
        else if (req.user?.userType === UserType.CLIENT) {
            // Clients can only see schedules for their gym
            if (!req.user.gymId) {
                res.status(400).json({
                    success: false,
                    error: 'You must be assigned to a gym to view schedules',
                });
                return;
            }
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
        const schedules = await ActiveSchedule.find(query)
            .populate('gymId', 'name')
            .populate('templateId', 'name')
            .sort({ createdAt: -1 });
        // Add computed availability fields for clients
        const enrichedSchedules = schedules.map(schedule => {
            const scheduleObj = schedule.toJSON();
            // Add computed fields to each timeslot
            scheduleObj.days = scheduleObj.days.map((day) => ({
                ...day,
                timeSlots: day.timeSlots.map((slot) => ({
                    ...slot,
                    availableSpots: slot.capacity - slot.assignedClients.length,
                    isUserAssigned: req.user?.id ? slot.assignedClients.includes(req.user.id) : false,
                })),
            }));
            return scheduleObj;
        });
        const response = {
            success: true,
            data: enrichedSchedules,
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching active schedules:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch active schedules',
        });
    }
};
/**
 * Get active schedule by ID
 */
export const getActiveScheduleById = async (req, res) => {
    try {
        const validation = IdParamSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid active schedule ID',
            });
            return;
        }
        const { id } = validation.data;
        const schedule = await ActiveSchedule.findById(id)
            .populate('gymId', 'name')
            .populate('templateId', 'name');
        if (!schedule) {
            res.status(404).json({
                success: false,
                error: 'Active schedule not found',
            });
            return;
        }
        // Check access permissions
        if (req.user?.userType === UserType.OWNER && schedule.gymId.toString() !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only access your own gym\'s schedules.',
            });
            return;
        }
        // Coaches can only view schedules they're assigned to
        if (req.user?.userType === UserType.COACH) {
            const isAssigned = schedule.coachIds.includes(req.user.id);
            if (!isAssigned) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied. You can only view schedules you are assigned to.',
                });
                return;
            }
        }
        // Clients can only view schedules from their gym
        if (req.user?.userType === UserType.CLIENT) {
            if (!req.user.gymId) {
                res.status(400).json({
                    success: false,
                    error: 'You must be assigned to a gym to view schedules',
                });
                return;
            }
            if (schedule.gymId.toString() !== req.user.gymId) {
                res.status(403).json({
                    success: false,
                    error: 'Access denied. You can only view schedules from your gym.',
                });
                return;
            }
        }
        // Add computed availability fields
        const scheduleObj = schedule.toJSON();
        scheduleObj.days = scheduleObj.days.map((day) => ({
            ...day,
            timeSlots: day.timeSlots.map((slot) => ({
                ...slot,
                availableSpots: slot.capacity - slot.assignedClients.length,
                isUserAssigned: req.user?.id ? slot.assignedClients.includes(req.user.id) : false,
            })),
        }));
        const response = {
            success: true,
            data: scheduleObj,
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error fetching active schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch active schedule',
        });
    }
};
/**
 * Create active schedule from template (lazy create)
 */
export const createActiveSchedule = async (req, res) => {
    try {
        const validation = CreateActiveScheduleSchema.safeParse(req.body);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid active schedule data',
                details: validation.error.errors,
            });
            return;
        }
        const { templateId } = validation.data;
        // Check if active schedule already exists for this template
        const existingSchedule = await ActiveSchedule.findOne({ templateId });
        if (existingSchedule) {
            res.status(400).json({
                success: false,
                error: 'An active schedule already exists for this template',
            });
            return;
        }
        // Fetch the template
        const template = await ScheduleTemplate.findById(templateId);
        if (!template) {
            res.status(404).json({
                success: false,
                error: 'Schedule template not found',
            });
            return;
        }
        // Check access permissions
        if (req.user?.userType === UserType.OWNER && template.gymId.toString() !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only create schedules for your own gym.',
            });
            return;
        }
        // Create active schedule from template
        const newSchedule = new ActiveSchedule({
            gymId: template.gymId,
            templateId: template.id,
            coachIds: template.coachIds, // Copy coach IDs from template
            days: template.days,
            lastResetAt: new Date(),
        });
        const savedSchedule = await newSchedule.save();
        await savedSchedule.populate('gymId', 'name');
        await savedSchedule.populate('templateId', 'name');
        const response = {
            success: true,
            data: savedSchedule.toJSON(),
            message: 'Active schedule created successfully',
        };
        res.status(201).json(response);
    }
    catch (error) {
        console.error('Error creating active schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create active schedule',
        });
    }
};
/**
 * Delete active schedule
 */
export const deleteActiveSchedule = async (req, res) => {
    try {
        const validation = IdParamSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid active schedule ID',
            });
            return;
        }
        const { id } = validation.data;
        const schedule = await ActiveSchedule.findById(id);
        if (!schedule) {
            res.status(404).json({
                success: false,
                error: 'Active schedule not found',
            });
            return;
        }
        // Check access permissions
        if (req.user?.userType === UserType.OWNER && schedule.gymId.toString() !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only delete your own gym\'s schedules.',
            });
            return;
        }
        await ActiveSchedule.findByIdAndDelete(id);
        const response = {
            success: true,
            message: 'Active schedule deleted successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error deleting active schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to delete active schedule',
        });
    }
};
/**
 * Reset active schedule from template
 */
export const resetActiveSchedule = async (req, res) => {
    try {
        const validation = IdParamSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid active schedule ID',
            });
            return;
        }
        const { id } = validation.data;
        const schedule = await ActiveSchedule.findById(id);
        if (!schedule) {
            res.status(404).json({
                success: false,
                error: 'Active schedule not found',
            });
            return;
        }
        // Check access permissions
        if (req.user?.userType === UserType.OWNER && schedule.gymId.toString() !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied. You can only reset your own gym\'s schedules.',
            });
            return;
        }
        // Fetch the template
        const template = await ScheduleTemplate.findById(schedule.templateId);
        if (!template) {
            res.status(404).json({
                success: false,
                error: 'Schedule template not found',
            });
            return;
        }
        // Reset schedule with template data while preserving client assignments
        // Note: Using toObject() here because we're assigning to Mongoose document fields
        // The final toJSON() call will transform _id to id when returning to client
        schedule.days = template.days.map((templateDay, dayIndex) => {
            const existingDay = schedule.days[dayIndex];
            return {
                ...templateDay.toObject(),
                timeSlots: templateDay.timeSlots.map((templateSlot) => {
                    // Find matching existing slot by start time
                    const existingSlot = existingDay?.timeSlots?.find(s => s.startTime === templateSlot.startTime);
                    return {
                        ...templateSlot.toObject(),
                        // Preserve existing client assignments if slot exists
                        assignedClients: existingSlot?.assignedClients || [],
                    };
                }),
            };
        });
        schedule.lastResetAt = new Date();
        // Preserve coachIds from active schedule (don't reset them)
        const updatedSchedule = await schedule.save();
        await updatedSchedule.populate('gymId', 'name');
        await updatedSchedule.populate('templateId', 'name');
        const response = {
            success: true,
            data: updatedSchedule.toJSON(),
            message: 'Active schedule reset successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error resetting active schedule:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to reset active schedule',
        });
    }
};
/**
 * Assign staff (coach) to active schedule
 */
export const assignStaff = async (req, res) => {
    try {
        const paramsValidation = IdParamSchema.safeParse(req.params);
        const bodyValidation = AssignStaffSchema.safeParse(req.body);
        if (!paramsValidation.success || !bodyValidation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
            });
            return;
        }
        const { id } = paramsValidation.data;
        const { coachId } = bodyValidation.data;
        const schedule = await ActiveSchedule.findById(id);
        if (!schedule) {
            res.status(404).json({
                success: false,
                error: 'Active schedule not found',
            });
            return;
        }
        // Check access permissions
        if (req.user?.userType === UserType.OWNER && schedule.gymId.toString() !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied.',
            });
            return;
        }
        // Check if coach already assigned
        if (schedule.coachIds.includes(coachId)) {
            res.status(400).json({
                success: false,
                error: 'Coach is already assigned to this schedule',
            });
            return;
        }
        // Validate coach
        const coach = await User.findById(coachId);
        if (!coach) {
            res.status(404).json({
                success: false,
                error: 'Coach not found',
            });
            return;
        }
        if (coach.gymId !== schedule.gymId.toString()) {
            res.status(400).json({
                success: false,
                error: 'Coach must belong to the same gym',
            });
            return;
        }
        if (!['coach', 'admin', 'owner'].includes(coach.userType)) {
            res.status(400).json({
                success: false,
                error: 'User must have coach, admin, or owner role',
            });
            return;
        }
        // Add coach to schedule
        schedule.coachIds.push(coachId);
        const updatedSchedule = await schedule.save();
        await updatedSchedule.populate('gymId', 'name');
        await updatedSchedule.populate('templateId', 'name');
        const response = {
            success: true,
            data: updatedSchedule.toJSON(),
            message: 'Coach assigned successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error assigning staff:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to assign staff',
        });
    }
};
/**
 * Unassign staff (coach) from active schedule
 */
export const unassignStaff = async (req, res) => {
    try {
        const validation = UnassignStaffParamSchema.safeParse(req.params);
        if (!validation.success) {
            res.status(400).json({
                success: false,
                error: 'Invalid request data',
            });
            return;
        }
        const { id, coachId } = validation.data;
        const schedule = await ActiveSchedule.findById(id);
        if (!schedule) {
            res.status(404).json({
                success: false,
                error: 'Active schedule not found',
            });
            return;
        }
        // Check access permissions
        if (req.user?.userType === UserType.OWNER && schedule.gymId.toString() !== req.user.gymId) {
            res.status(403).json({
                success: false,
                error: 'Access denied.',
            });
            return;
        }
        // Prevent removing the last coach
        if (schedule.coachIds.length === 1) {
            res.status(400).json({
                success: false,
                error: 'Cannot remove the last coach from the schedule',
            });
            return;
        }
        // Check if coach is assigned
        const coachIndex = schedule.coachIds.indexOf(coachId);
        if (coachIndex === -1) {
            res.status(400).json({
                success: false,
                error: 'Coach is not assigned to this schedule',
            });
            return;
        }
        // Remove coach from schedule
        schedule.coachIds.splice(coachIndex, 1);
        const updatedSchedule = await schedule.save();
        await updatedSchedule.populate('gymId', 'name');
        await updatedSchedule.populate('templateId', 'name');
        const response = {
            success: true,
            data: updatedSchedule.toJSON(),
            message: 'Coach unassigned successfully',
        };
        res.json(response);
    }
    catch (error) {
        console.error('Error unassigning staff:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to unassign staff',
        });
    }
};
//# sourceMappingURL=activeSchedules.js.map