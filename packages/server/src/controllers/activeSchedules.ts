import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ActiveSchedule } from '../models/ActiveSchedule.js';
import { ScheduleTemplate } from '../models/ScheduleTemplate.js';
import { resetScheduleFromTemplate } from '../services/scheduleReset.js';
import {
  ApiResponse,
  CreateActiveScheduleSchema,
  UpdateTimeslotAssignmentSchema,
  AddTimeslotClientSchema,
  UserType,
} from '@ironlogic4/shared';
import { IdParamSchema } from '@ironlogic4/shared/schemas/api';
import { validateCoachIds } from '../utils/validateCoachIds.js';
import { validateClientId } from '../utils/validateClientId.js';
import { z } from 'zod';

const TimeslotParamSchema = z.object({
  id: z.string().min(1),
  timeslotId: z.string().min(1),
});

const TimeslotClientParamSchema = z.object({
  id: z.string().min(1),
  timeslotId: z.string().min(1),
  clientId: z.string().min(1),
});

/**
 * Find a timeslot within a schedule's days and, for coaches, verify they're
 * assigned to coach that specific timeslot. Returns the timeslot's capacity
 * on success, or null with a response already sent on failure.
 */
function findTimeslotAndCheckCoachAccess(
  schedule: { days: { timeSlots: { id?: string; capacity: number; coachIds: string[] }[] }[] },
  timeslotId: string,
  req: AuthenticatedRequest,
  res: Response
): number | null {
  for (const day of schedule.days) {
    const slot = day.timeSlots.find(s => s.id === timeslotId);
    if (slot) {
      if (req.user?.userType === UserType.COACH && !slot.coachIds.includes(req.user.id)) {
        res.status(403).json({
          success: false,
          error: 'You can only manage clients for timeslots you coach.',
        });
        return null;
      }
      return slot.capacity;
    }
  }

  res.status(404).json({
    success: false,
    error: 'Timeslot not found',
  });
  return null;
}

/**
 * Get all active schedules with filtering
 */
export const getActiveSchedules = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const { gymId, coachId } = req.query;

    const query: any = {};

    // Gym filtering - required for owners, coaches and clients, optional for admins
    if (req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) {
      query.gymId = req.user.gymId;
    } else if (req.user?.userType === UserType.CLIENT) {
      // Clients can only see schedules for their gym
      if (!req.user.gymId) {
        res.status(400).json({
          success: false,
          error: 'You must be assigned to a gym to view schedules',
        });
        return;
      }
      query.gymId = req.user.gymId;
    } else if (gymId) {
      query.gymId = gymId;
    }

    // Coach filtering - coaches can only see schedules they're assigned to
    if (req.user?.userType === UserType.COACH || coachId) {
      const filterCoachId = coachId || req.user?.id;
      query['days.timeSlots.coachIds'] = filterCoachId;
    }

    const schedules = await ActiveSchedule.find(query)
      .populate('gymId', 'name')
      .populate('templateId', 'name')
      .sort({ createdAt: -1 });

    // Add computed availability fields for clients
    const enrichedSchedules = schedules.map(schedule => {
      const scheduleObj: any = schedule.toJSON();

      // Add computed fields to each timeslot
      scheduleObj.days = scheduleObj.days.map((day: any) => ({
        ...day,
        timeSlots: day.timeSlots.map((slot: any) => ({
          ...slot,
          availableSpots: slot.capacity - slot.assignedClients.length,
          isUserAssigned: req.user?.id ? slot.assignedClients.includes(req.user.id) : false,
        })),
      }));

      return scheduleObj;
    });

    const response: ApiResponse<typeof enrichedSchedules> = {
      success: true,
      data: enrichedSchedules,
    };

    res.json(response);
  } catch (error) {
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
export const getActiveScheduleById = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
    if ((req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) && schedule.gymId.toString() !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only access your own gym\'s schedules.',
      });
      return;
    }

    // Coaches can only view schedules they're assigned to
    if (req.user?.userType === UserType.COACH) {
      const isAssigned = schedule.days.some(day =>
        day.timeSlots.some(slot => slot.coachIds.includes(req.user!.id))
      );
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
    const scheduleObj: any = schedule.toJSON();
    scheduleObj.days = scheduleObj.days.map((day: any) => ({
      ...day,
      timeSlots: day.timeSlots.map((slot: any) => ({
        ...slot,
        availableSpots: slot.capacity - slot.assignedClients.length,
        isUserAssigned: req.user?.id ? slot.assignedClients.includes(req.user.id) : false,
      })),
    }));

    const response: ApiResponse<typeof scheduleObj> = {
      success: true,
      data: scheduleObj,
    };

    res.json(response);
  } catch (error) {
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
export const createActiveSchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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

    // Determine gymId based on user type
    // For OWNER/COACH/CLIENT, always use their gym. For ADMIN, allow specifying gymId
    let gymId: string | undefined;
    if (req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH || req.user?.userType === UserType.CLIENT) {
      if (!req.user.gymId) {
        res.status(400).json({
          success: false,
          error: 'You must be assigned to a gym to create an active schedule',
        });
        return;
      }
      gymId = req.user.gymId;
    } else {
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

    // Check if an active schedule already exists for this gym
    const existingSchedule = await ActiveSchedule.findOne({ gymId });
    if (existingSchedule) {
      res.status(400).json({
        success: false,
        error: 'An active schedule already exists for this gym',
      });
      return;
    }

    // Fetch the gym's schedule template
    const template = await ScheduleTemplate.findOne({ gymId });
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'No schedule template exists for this gym yet. Create one first.',
      });
      return;
    }

    // Create active schedule from template
    const newSchedule = new ActiveSchedule({
      gymId: template.gymId,
      templateId: template.id,
      days: template.days,
      lastResetAt: new Date(),
    });

    const savedSchedule = await newSchedule.save();
    await savedSchedule.populate('gymId', 'name');
    await savedSchedule.populate('templateId', 'name');

    const response: ApiResponse<any> = {
      success: true,
      data: savedSchedule.toJSON(),
      message: 'Active schedule created successfully',
    };

    res.status(201).json(response);
  } catch (error) {
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
export const deleteActiveSchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
    if ((req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) && schedule.gymId.toString() !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only delete your own gym\'s schedules.',
      });
      return;
    }

    await ActiveSchedule.findByIdAndDelete(id);

    const response: ApiResponse<null> = {
      success: true,
      message: 'Active schedule deleted successfully',
    };

    res.json(response);
  } catch (error) {
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
export const resetActiveSchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
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
    if ((req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) && schedule.gymId.toString() !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied. You can only reset your own gym\'s schedules.',
      });
      return;
    }

    // Reset the active schedule to exactly match the template — structure,
    // capacity, coaches, location, and client assignments all come fresh from
    // the template, discarding anything active-schedule-specific.
    try {
      await resetScheduleFromTemplate(schedule);
    } catch (err) {
      if (err instanceof Error && err.message === 'Schedule template not found') {
        res.status(404).json({
          success: false,
          error: 'Schedule template not found',
        });
        return;
      }
      throw err;
    }

    await schedule.populate('gymId', 'name');
    await schedule.populate('templateId', 'name');

    const response: ApiResponse<any> = {
      success: true,
      data: schedule.toJSON(),
      message: 'Active schedule reset successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error resetting active schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset active schedule',
    });
  }
};

/**
 * Update coach and location assignment for a specific timeslot on the active schedule
 */
export const updateTimeslotAssignment = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramsValidation = TimeslotParamSchema.safeParse(req.params);
    const bodyValidation = UpdateTimeslotAssignmentSchema.safeParse(req.body);

    if (!paramsValidation.success || !bodyValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: [...(paramsValidation.error?.errors || []), ...(bodyValidation.error?.errors || [])],
      });
      return;
    }

    const { id, timeslotId } = paramsValidation.data;
    const { coachIds, location } = bodyValidation.data;

    const schedule = await ActiveSchedule.findById(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Active schedule not found',
      });
      return;
    }

    // Check access permissions
    if ((req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) && schedule.gymId.toString() !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied.',
      });
      return;
    }

    // Validate coaches
    const coachValidation = await validateCoachIds(coachIds, schedule.gymId.toString());
    if (!coachValidation.valid) {
      res.status(400).json({
        success: false,
        error: coachValidation.error,
      });
      return;
    }

    // Atomically update just the matching timeslot subdocument, leaving
    // sibling timeslots (and their assignedClients) untouched
    const updatedSchedule = await ActiveSchedule.findOneAndUpdate(
      { _id: id, 'days.timeSlots._id': timeslotId },
      {
        $set: {
          'days.$[].timeSlots.$[slot].coachIds': coachIds,
          'days.$[].timeSlots.$[slot].location': location,
        },
      },
      {
        arrayFilters: [{ 'slot._id': timeslotId }],
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSchedule) {
      res.status(404).json({
        success: false,
        error: 'Timeslot not found',
      });
      return;
    }

    await updatedSchedule.populate('gymId', 'name');
    await updatedSchedule.populate('templateId', 'name');

    const response: ApiResponse<any> = {
      success: true,
      data: updatedSchedule.toJSON(),
      message: 'Timeslot assignment updated successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating timeslot assignment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update timeslot assignment',
    });
  }
};

/**
 * Add a client to a specific timeslot on the active schedule
 */
export const addActiveTimeslotClient = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const paramsValidation = TimeslotParamSchema.safeParse(req.params);
    const bodyValidation = AddTimeslotClientSchema.safeParse(req.body);

    if (!paramsValidation.success || !bodyValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: [...(paramsValidation.error?.errors || []), ...(bodyValidation.error?.errors || [])],
      });
      return;
    }

    const { id, timeslotId } = paramsValidation.data;
    const { clientId } = bodyValidation.data;

    const schedule = await ActiveSchedule.findById(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Active schedule not found',
      });
      return;
    }

    // Check access permissions
    if ((req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) && schedule.gymId.toString() !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied.',
      });
      return;
    }

    // Find the timeslot, get its capacity, and (for coaches) verify assignment
    const targetCapacity = findTimeslotAndCheckCoachAccess(schedule, timeslotId, req, res);
    if (targetCapacity === null) return;

    // Validate the client belongs to the same gym and has the client role
    const clientValidation = await validateClientId(clientId, schedule.gymId.toString());
    if (!clientValidation.valid) {
      res.status(400).json({
        success: false,
        error: clientValidation.error,
      });
      return;
    }

    // Atomic, capacity-safe update — mirrors the client self-service joinTimeslot pattern
    const updatedSchedule = await ActiveSchedule.findOneAndUpdate(
      {
        _id: id,
        'days.timeSlots': {
          $elemMatch: {
            _id: timeslotId,
            assignedClients: { $ne: clientId },
            [`assignedClients.${targetCapacity - 1}`]: { $exists: false },
          },
        },
      },
      {
        $addToSet: {
          'days.$[].timeSlots.$[slot].assignedClients': clientId,
        },
      },
      {
        arrayFilters: [{ 'slot._id': timeslotId }],
        new: true,
        runValidators: true,
      }
    );

    if (!updatedSchedule) {
      const recheckSchedule = await ActiveSchedule.findById(id);
      if (recheckSchedule) {
        for (const day of recheckSchedule.days) {
          const slot = day.timeSlots.find(s => s.id === timeslotId);
          if (slot) {
            if (slot.assignedClients.includes(clientId)) {
              res.status(400).json({
                success: false,
                error: 'Client is already assigned to this timeslot',
              });
              return;
            }
            if (slot.assignedClients.length >= slot.capacity) {
              res.status(400).json({
                success: false,
                error: 'This timeslot is at full capacity',
              });
              return;
            }
          }
        }
      }

      res.status(400).json({
        success: false,
        error: 'Failed to add client to timeslot',
      });
      return;
    }

    await updatedSchedule.populate('gymId', 'name');
    await updatedSchedule.populate('templateId', 'name');

    const response: ApiResponse<any> = {
      success: true,
      data: updatedSchedule.toJSON(),
      message: 'Client added to timeslot successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error adding client to timeslot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add client to timeslot',
    });
  }
};

/**
 * Remove a client from a specific timeslot on the active schedule
 */
export const removeActiveTimeslotClient = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = TimeslotClientParamSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
      });
      return;
    }

    const { id, timeslotId, clientId } = validation.data;

    const schedule = await ActiveSchedule.findById(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Active schedule not found',
      });
      return;
    }

    // Check access permissions
    if ((req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) && schedule.gymId.toString() !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'Access denied.',
      });
      return;
    }

    // For coaches, verify they're assigned to coach this specific timeslot
    if (findTimeslotAndCheckCoachAccess(schedule, timeslotId, req, res) === null) return;

    const updatedSchedule = await ActiveSchedule.findOneAndUpdate(
      {
        _id: id,
        'days.timeSlots': { $elemMatch: { _id: timeslotId, assignedClients: clientId } },
      },
      { $pull: { 'days.$[].timeSlots.$[slot].assignedClients': clientId } },
      { arrayFilters: [{ 'slot._id': timeslotId }], new: true, runValidators: true }
    );

    if (!updatedSchedule) {
      res.status(400).json({
        success: false,
        error: 'Client is not assigned to this timeslot',
      });
      return;
    }

    await updatedSchedule.populate('gymId', 'name');
    await updatedSchedule.populate('templateId', 'name');

    const response: ApiResponse<any> = {
      success: true,
      data: updatedSchedule.toJSON(),
      message: 'Client removed from timeslot successfully',
    };

    res.json(response);
  } catch (error) {
    console.error('Error removing client from timeslot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove client from timeslot',
    });
  }
};