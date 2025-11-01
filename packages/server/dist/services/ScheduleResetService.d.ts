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
export declare class ScheduleResetService {
    /**
     * Reset all active schedules by fetching their templates and copying the days array
     * Preserves coachIds and other metadata from the active schedule
     *
     * @returns Summary of reset operations
     */
    static resetAllActiveSchedules(): Promise<ResetSummary>;
    /**
     * Reset a specific active schedule by ID
     *
     * @param scheduleId - The ID of the active schedule to reset
     * @returns Summary of reset operation
     */
    static resetScheduleById(scheduleId: string): Promise<ResetSummary>;
    /**
     * Reset all active schedules for a specific gym
     *
     * @param gymId - The ID of the gym
     * @returns Summary of reset operations
     */
    static resetSchedulesByGym(gymId: string): Promise<ResetSummary>;
}
//# sourceMappingURL=ScheduleResetService.d.ts.map