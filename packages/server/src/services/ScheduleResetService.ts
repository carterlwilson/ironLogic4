import { ActiveSchedule } from '../models/ActiveSchedule';
import { ScheduleTemplate } from '../models/ScheduleTemplate';

export interface ResetSummary {
  success: boolean;
  resetCount: number;
  failedCount: number;
  errors: string[];
  message: string;
}

/**
 * Service for resetting active schedules from their templates
 * Useful for scheduled jobs (e.g., weekly reset every Sunday)
 */
export class ScheduleResetService {
  /**
   * Reset all active schedules by fetching their templates and copying the days array
   * Preserves coachIds and other metadata from the active schedule
   *
   * @returns Summary of reset operations
   */
  static async resetAllActiveSchedules(): Promise<ResetSummary> {
    const errors: string[] = [];
    let resetCount = 0;
    let failedCount = 0;

    try {
      // Find all active schedules
      const activeSchedules = await ActiveSchedule.find();

      if (activeSchedules.length === 0) {
        return {
          success: true,
          resetCount: 0,
          failedCount: 0,
          errors: [],
          message: 'No active schedules found to reset',
        };
      }

      // Reset each active schedule
      for (const schedule of activeSchedules) {
        try {
          // Fetch the template
          const template = await ScheduleTemplate.findById(schedule.templateId);

          if (!template) {
            failedCount++;
            errors.push(
              `Template not found for active schedule ${schedule.id} (template ID: ${schedule.templateId})`
            );
            continue;
          }

          // Update the schedule with template data
          schedule.days = template.days; // Replace days array
          schedule.lastResetAt = new Date(); // Update reset timestamp
          // Preserve coachIds from active schedule (don't reset them)

          await schedule.save();
          resetCount++;

          console.log(`Reset active schedule ${schedule.id} from template ${template.id}`);
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to reset schedule ${schedule.id}: ${errorMessage}`);
          console.error(`Error resetting schedule ${schedule.id}:`, error);
        }
      }

      const success = failedCount === 0;
      const message = success
        ? `Successfully reset ${resetCount} active schedule(s)`
        : `Reset ${resetCount} schedule(s), ${failedCount} failed`;

      return {
        success,
        resetCount,
        failedCount,
        errors,
        message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in resetAllActiveSchedules:', error);

      return {
        success: false,
        resetCount,
        failedCount: failedCount + 1,
        errors: [...errors, `Service error: ${errorMessage}`],
        message: 'Failed to reset active schedules',
      };
    }
  }

  /**
   * Reset a specific active schedule by ID
   *
   * @param scheduleId - The ID of the active schedule to reset
   * @returns Summary of reset operation
   */
  static async resetScheduleById(scheduleId: string): Promise<ResetSummary> {
    try {
      const schedule = await ActiveSchedule.findById(scheduleId);

      if (!schedule) {
        return {
          success: false,
          resetCount: 0,
          failedCount: 1,
          errors: ['Active schedule not found'],
          message: 'Active schedule not found',
        };
      }

      // Fetch the template
      const template = await ScheduleTemplate.findById(schedule.templateId);

      if (!template) {
        return {
          success: false,
          resetCount: 0,
          failedCount: 1,
          errors: [`Template not found (ID: ${schedule.templateId})`],
          message: 'Template not found',
        };
      }

      // Update the schedule with template data
      schedule.days = template.days;
      schedule.lastResetAt = new Date();
      // Preserve coachIds from active schedule

      await schedule.save();

      console.log(`Reset active schedule ${schedule.id} from template ${template.id}`);

      return {
        success: true,
        resetCount: 1,
        failedCount: 0,
        errors: [],
        message: 'Successfully reset active schedule',
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in resetScheduleById:', error);

      return {
        success: false,
        resetCount: 0,
        failedCount: 1,
        errors: [`Failed to reset schedule: ${errorMessage}`],
        message: 'Failed to reset active schedule',
      };
    }
  }

  /**
   * Reset all active schedules for a specific gym
   *
   * @param gymId - The ID of the gym
   * @returns Summary of reset operations
   */
  static async resetSchedulesByGym(gymId: string): Promise<ResetSummary> {
    const errors: string[] = [];
    let resetCount = 0;
    let failedCount = 0;

    try {
      // Find all active schedules for this gym
      const activeSchedules = await ActiveSchedule.find({ gymId });

      if (activeSchedules.length === 0) {
        return {
          success: true,
          resetCount: 0,
          failedCount: 0,
          errors: [],
          message: 'No active schedules found for this gym',
        };
      }

      // Reset each active schedule
      for (const schedule of activeSchedules) {
        try {
          // Fetch the template
          const template = await ScheduleTemplate.findById(schedule.templateId);

          if (!template) {
            failedCount++;
            errors.push(
              `Template not found for active schedule ${schedule.id} (template ID: ${schedule.templateId})`
            );
            continue;
          }

          // Update the schedule with template data
          schedule.days = template.days;
          schedule.lastResetAt = new Date();

          await schedule.save();
          resetCount++;

          console.log(`Reset active schedule ${schedule.id} for gym ${gymId}`);
        } catch (error) {
          failedCount++;
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          errors.push(`Failed to reset schedule ${schedule.id}: ${errorMessage}`);
          console.error(`Error resetting schedule ${schedule.id}:`, error);
        }
      }

      const success = failedCount === 0;
      const message = success
        ? `Successfully reset ${resetCount} active schedule(s) for gym ${gymId}`
        : `Reset ${resetCount} schedule(s) for gym ${gymId}, ${failedCount} failed`;

      return {
        success,
        resetCount,
        failedCount,
        errors,
        message,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Error in resetSchedulesByGym:', error);

      return {
        success: false,
        resetCount,
        failedCount: failedCount + 1,
        errors: [...errors, `Service error: ${errorMessage}`],
        message: 'Failed to reset active schedules for gym',
      };
    }
  }
}