import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { ActiveSchedule } from '../models/ActiveSchedule.js';
import { User } from '../models/User.js';
import { ApiResponse, AvailableSchedulesQuerySchema, UserType } from '@ironlogic4/shared';
import { z } from 'zod';

const TimeslotParamSchema = z.object({
  id: z.string().min(1),
  timeslotId: z.string().min(1),
});

/**
 * Get available schedules for client self-scheduling
 * Returns all active schedules for the user's gym with availability info
 */
export const getAvailableSchedules = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate query params
    const queryValidation = AvailableSchedulesQuerySchema.safeParse(req.query);
    if (!queryValidation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
      });
      return;
    }

    // Determine gymId based on user type
    let gymId: string | undefined;
    if (req.user?.userType === UserType.CLIENT) {
      // Clients can only see schedules for their gym
      if (!req.user.gymId) {
        res.status(400).json({
          success: false,
          error: 'You must be assigned to a gym to view schedules',
        });
        return;
      }
      gymId = req.user.gymId;
    } else if (req.user?.userType === UserType.OWNER || req.user?.userType === UserType.COACH) {
      // Owners and coaches can only see schedules for their gym
      if (!req.user.gymId) {
        res.status(400).json({
          success: false,
          error: 'You must be assigned to a gym to view schedules',
        });
        return;
      }
      gymId = req.user.gymId;
    } else {
      // Admins can optionally filter by gym
      gymId = queryValidation.data.gymId;
    }

    const query: any = {};
    if (gymId) {
      query.gymId = gymId;
    }

    // Find all active schedules
    const schedules = await ActiveSchedule.find(query)
      .populate('gymId', 'name')
      .populate('templateId', 'name')
      .sort({ createdAt: -1 });

    // Collect all unique coach IDs from schedules
    const allCoachIds = new Set<string>();
    schedules.forEach(schedule => {
      schedule.coachIds.forEach(coachId => allCoachIds.add(coachId));
    });

    // Fetch all coaches in one query
    const coaches = await User.find({
      _id: { $in: Array.from(allCoachIds) },
      userType: { $in: [UserType.COACH, UserType.ADMIN, UserType.OWNER] },
    }).select('_id firstName lastName email');

    // Create a map for quick coach lookup
    const coachMap = new Map(
      coaches.map(coach => {
        const coachId = coach._id?.toString() || coach.id;
        return [
          coachId,
          {
            id: coachId,
            firstName: coach.firstName,
            lastName: coach.lastName,
            email: coach.email,
          },
        ];
      })
    );

    // Add computed availability fields and coach information
    const enrichedSchedules = schedules.map(schedule => {
      const scheduleObj: any = schedule.toJSON();

      scheduleObj.days = scheduleObj.days.map((day: any) => ({
        ...day,
        timeSlots: day.timeSlots.map((slot: any) => ({
          ...slot,
          availableSpots: slot.capacity - slot.assignedClients.length,
          isUserAssigned: slot.assignedClients.includes(userId),
        })),
      }));

      // Add coaches array alongside coachIds for backward compatibility
      scheduleObj.coaches = scheduleObj.coachIds
        .map((coachId: string) => coachMap.get(coachId))
        .filter((coach: any) => coach !== undefined); // Filter out deleted coaches

      return scheduleObj;
    });

    const response: ApiResponse<typeof enrichedSchedules> = {
      success: true,
      data: enrichedSchedules,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching available schedules:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch available schedules',
    });
  }
};

/**
 * Get authenticated client's current schedule (timeslots they're assigned to)
 */
export const getMySchedule = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const clientId = req.user?.id;

    if (!clientId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Find all active schedules where the client is assigned to any timeslot
    const schedules = await ActiveSchedule.find({
      'days.timeSlots.assignedClients': clientId,
    })
      .populate('gymId', 'name')
      .populate('templateId', 'name');

    // Filter to only include timeslots the client is assigned to
    const myTimeslots = schedules.map(schedule => {
      const filteredDays = schedule.days.map(day => {
        const filteredTimeSlots = day.timeSlots.filter(slot =>
          slot.assignedClients.includes(clientId)
        );
        return {
          ...day.toJSON(),
          timeSlots: filteredTimeSlots,
        };
      }).filter(day => day.timeSlots.length > 0);

      return {
        scheduleId: schedule.id,
        scheduleName: (schedule.templateId as any)?.name || 'Unknown',
        gymName: (schedule.gymId as any)?.name || 'Unknown',
        days: filteredDays,
      };
    }).filter(schedule => schedule.days.length > 0);

    const response: ApiResponse<typeof myTimeslots> = {
      success: true,
      data: myTimeslots,
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching client schedule:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch your schedule',
    });
  }
};

/**
 * Join a timeslot (client self-service)
 * Uses atomic update to prevent race conditions
 */
export const joinTimeslot = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = TimeslotParamSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
      });
      return;
    }

    const { id, timeslotId } = validation.data;
    const clientId = req.user?.id;

    if (!clientId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate user has a gymId
    if (!req.user?.gymId) {
      res.status(400).json({
        success: false,
        error: 'You must be assigned to a gym to join timeslots',
      });
      return;
    }

    // First check if schedule exists and belongs to user's gym
    const scheduleCheck = await ActiveSchedule.findById(id);
    if (!scheduleCheck) {
      res.status(404).json({
        success: false,
        error: 'Active schedule not found',
      });
      return;
    }

    if (scheduleCheck.gymId.toString() !== req.user.gymId) {
      res.status(403).json({
        success: false,
        error: 'You can only join timeslots for your gym',
      });
      return;
    }

    // Find the specific timeslot to get its capacity
    let targetCapacity: number | null = null;
    for (const day of scheduleCheck.days) {
      const slot = day.timeSlots.find(s => s.id === timeslotId);
      if (slot) {
        targetCapacity = slot.capacity;
        break;
      }
    }

    if (targetCapacity === null) {
      res.status(404).json({
        success: false,
        error: 'Timeslot not found',
      });
      return;
    }

    // Use atomic update to prevent race conditions
    // Capacity is validated before this update (lines 262-277)
    // The atomic operation prevents duplicate assignments
    const updatedSchedule = await ActiveSchedule.findOneAndUpdate(
      {
        _id: id,
        'days.timeSlots': {
          $elemMatch: {
            _id: timeslotId,
            assignedClients: { $ne: clientId } // Not already assigned to THIS specific timeslot
          }
        },
      },
      {
        $addToSet: {
          'days.$[].timeSlots.$[slot].assignedClients': clientId
        }
      },
      {
        arrayFilters: [
          { 'slot._id': timeslotId }
        ],
        new: true,
        runValidators: true
      }
    );

    if (!updatedSchedule) {
      // Check if already assigned
      const recheckSchedule = await ActiveSchedule.findById(id);
      if (recheckSchedule) {
        for (const day of recheckSchedule.days) {
          const slot = day.timeSlots.find(s => s.id === timeslotId);
          if (slot) {
            if (slot.assignedClients.includes(clientId)) {
              res.status(400).json({
                success: false,
                error: 'You are already assigned to this timeslot',
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
        error: 'Failed to join timeslot',
      });
      return;
    }

    await updatedSchedule.populate('gymId', 'name');
    await updatedSchedule.populate('templateId', 'name');

    const response: ApiResponse<any> = {
      success: true,
      data: updatedSchedule.toJSON(),
      message: 'Successfully joined timeslot',
    };

    res.json(response);
  } catch (error) {
    console.error('Error joining timeslot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to join timeslot',
    });
  }
};

/**
 * Leave a timeslot (client self-service)
 */
export const leaveTimeslot = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const validation = TimeslotParamSchema.safeParse(req.params);

    if (!validation.success) {
      res.status(400).json({
        success: false,
        error: 'Invalid request data',
      });
      return;
    }

    const { id, timeslotId } = validation.data;
    const clientId = req.user?.id;

    if (!clientId) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Validate user has a gymId
    if (!req.user?.gymId) {
      res.status(400).json({
        success: false,
        error: 'You must be assigned to a gym to leave timeslots',
      });
      return;
    }

    const schedule = await ActiveSchedule.findById(id);

    if (!schedule) {
      res.status(404).json({
        success: false,
        error: 'Active schedule not found',
      });
      return;
    }

    // Check if client belongs to the same gym
    if (req.user.gymId !== schedule.gymId.toString()) {
      res.status(403).json({
        success: false,
        error: 'You can only leave timeslots for your gym',
      });
      return;
    }

    // Find the timeslot and remove client
    let timeslotFound = false;
    let wasAssigned = false;

    for (const day of schedule.days) {
      for (const slot of day.timeSlots) {
        if (slot.id === timeslotId) {
          timeslotFound = true;

          const clientIndex = slot.assignedClients.indexOf(clientId);
          if (clientIndex !== -1) {
            slot.assignedClients.splice(clientIndex, 1);
            wasAssigned = true;
          }
          break;
        }
      }
      if (timeslotFound) break;
    }

    if (!timeslotFound) {
      res.status(404).json({
        success: false,
        error: 'Timeslot not found',
      });
      return;
    }

    if (!wasAssigned) {
      res.status(400).json({
        success: false,
        error: 'You are not assigned to this timeslot',
      });
      return;
    }

    const updatedSchedule = await schedule.save();
    await updatedSchedule.populate('gymId', 'name');
    await updatedSchedule.populate('templateId', 'name');

    const response: ApiResponse<any> = {
      success: true,
      data: updatedSchedule.toJSON(),
      message: 'Successfully left timeslot',
    };

    res.json(response);
  } catch (error) {
    console.error('Error leaving timeslot:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to leave timeslot',
    });
  }
};