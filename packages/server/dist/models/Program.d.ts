import mongoose, { Document } from 'mongoose';
import { ActivityType, DistanceUnit } from '@ironlogic4/shared';
/**
 * PROGRAM MODEL SPECIFICATION
 * ===========================
 *
 * A Program represents a structured workout plan with a hierarchical organization:
 * Program -> Blocks -> Weeks -> Days -> Activities
 *
 * CORE HIERARCHY:
 * - Program: Top-level container (belongs to a Gym)
 * - Block: Training block/phase (e.g., "Strength Block", "Hypertrophy Phase")
 * - Week: Weekly structure within a block
 * - Day: Individual training day
 * - Activity: Specific exercise with prescription details
 *
 * ACTIVITY GROUP TARGETS:
 * - Can be set at Block level (applies to all weeks in the block)
 * - Can be set at Week level (overrides block-level targets for that week)
 * - Used for tracking activity distribution (e.g., 40% strength, 30% cardio, 30% other)
 */
/**
 * Activity Subdocument
 * -------------------
 * Represents a single planned activity within a day.
 *
 * FIELDS (10 total):
 * - _id: Auto-generated unique identifier
 * - activityTemplateId: Reference to ActivityTemplate
 * - type: Type of activity (lift, cardio, other, benchmark)
 * - order: Position within the day
 * - sets: Number of sets (optional)
 * - reps: Number of reps (optional)
 * - percentageOfMax: Percentage of 1RM (optional)
 * - time: Duration in minutes (optional)
 * - distance: Distance value (optional)
 * - distanceUnit: Unit for distance (optional)
 */
export interface IActivity {
    _id: mongoose.Types.ObjectId;
    activityTemplateId: string;
    type: ActivityType;
    order: number;
    sets?: number;
    reps?: number;
    percentageOfMax?: number;
    time?: number;
    distance?: number;
    distanceUnit?: DistanceUnit;
}
/**
 * Day Subdocument
 * ---------------
 * Represents a single training day within a week.
 *
 * FIELDS (4 total):
 * - _id: Auto-generated unique identifier
 * - name: Day name (e.g., "Monday", "Day 1")
 * - order: Position within the week
 * - activities: Array of activities for this day
 */
export interface IDay {
    _id: mongoose.Types.ObjectId;
    name: string;
    order: number;
    activities: IActivity[];
}
/**
 * ActivityGroupTarget Subdocument
 * -------------------------------
 * Represents a target percentage for an activity group.
 * Used at both Block and Week levels.
 *
 * FIELDS (2 total):
 * - activityGroupId: Reference to ActivityGroup
 * - targetPercentage: Target percentage (0-100)
 */
export interface IActivityGroupTarget {
    activityGroupId: string;
    targetPercentage: number;
}
/**
 * Week Subdocument
 * ----------------
 * Represents a week within a block.
 *
 * FIELDS (5 total):
 * - _id: Auto-generated unique identifier
 * - name: Week name (e.g., "Week 1", "Deload Week")
 * - order: Position within the block
 * - activityGroupTargets: Week-specific activity group targets
 * - days: Array of days in this week
 */
export interface IWeek {
    _id: mongoose.Types.ObjectId;
    name: string;
    order: number;
    activityGroupTargets: IActivityGroupTarget[];
    days: IDay[];
}
/**
 * Block Subdocument
 * -----------------
 * Represents a training block/phase within a program.
 *
 * FIELDS (5 total):
 * - _id: Auto-generated unique identifier
 * - name: Block name (e.g., "Strength Block", "Hypertrophy Phase")
 * - order: Position within the program
 * - activityGroupTargets: Block-level activity group targets
 * - weeks: Array of weeks in this block
 */
export interface IBlock {
    _id: mongoose.Types.ObjectId;
    name: string;
    order: number;
    activityGroupTargets: IActivityGroupTarget[];
    weeks: IWeek[];
}
/**
 * Program Progress Subdocument
 * ----------------------------
 * Tracks the current position and history of program progression.
 *
 * FIELDS (6 total):
 * - blockIndex: Current block index (0-based)
 * - weekIndex: Current week index within the block (0-based)
 * - startedAt: When the program was first started (null if not started)
 * - completedAt: When the program was completed (null if not completed)
 * - lastAdvancedAt: Last time the week was advanced (null if never advanced)
 * - totalWeeksCompleted: Total number of weeks completed across all blocks
 */
export interface IProgramProgress {
    blockIndex: number;
    weekIndex: number;
    startedAt: Date | null;
    completedAt: Date | null;
    lastAdvancedAt: Date | null;
    totalWeeksCompleted: number;
}
/**
 * Program Document Interface
 * --------------------------
 * Main program document with all fields and subdocuments.
 *
 * TOP-LEVEL FIELDS (10 total):
 * - name: Program name
 * - description: Optional description
 * - gymId: Reference to Gym
 * - createdBy: Reference to User who created it
 * - isActive: Whether program is active
 * - blocks: Array of training blocks
 * - currentProgress: Current progress tracking
 * - createdAt: Auto-generated timestamp
 * - updatedAt: Auto-generated timestamp
 */
export interface ProgramDocument extends Document {
    name: string;
    description?: string;
    gymId: string;
    createdBy: string;
    isActive: boolean;
    blocks: IBlock[];
    currentProgress: IProgramProgress;
    createdAt: Date;
    updatedAt: Date;
}
export declare const Program: mongoose.Model<ProgramDocument, {}, {}, {}, mongoose.Document<unknown, {}, ProgramDocument, {}, {}> & ProgramDocument & Required<{
    _id: unknown;
}> & {
    __v: number;
}, any>;
//# sourceMappingURL=Program.d.ts.map