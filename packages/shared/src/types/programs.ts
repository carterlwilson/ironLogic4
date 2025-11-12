import { ActivityType } from './activityTemplates.js';

export enum DistanceUnit {
  MILES = 'miles',
  KILOMETERS = 'kilometers',
  METERS = 'meters',
  YARDS = 'yards'
}

/**
 * Set - represents a single set within a lift activity
 * Total fields: 3
 */
export interface ISet {
  reps: number;              // 1-100
  percentageOfMax: number;   // 0-200
  benchmarkTemplateId?: string;  // Optional reference to benchmark template for this set
}

/**
 * Activity - represents a single planned activity within a day
 * Total fields: 8
 */
export interface IActivity {
  id: string;
  activityTemplateId: string;
  type: ActivityType;
  order: number;
  sets?: ISet[];  // Array of sets (required for lift activities)
  time?: number;
  distance?: number;
  distanceUnit?: DistanceUnit;
}

/**
 * Day - represents a single day within a week
 * Total fields: 4
 */
export interface IDay {
  id: string;
  name: string;
  order: number;
  activities: IActivity[];
}

/**
 * ActivityGroupTarget - represents a target percentage for an activity group
 * Used at both Block and Week levels
 * Total fields: 2
 */
export interface IActivityGroupTarget {
  activityGroupId: string;
  targetPercentage: number;
}

/**
 * Week - represents a week within a block
 * Total fields: 5
 */
export interface IWeek {
  id: string;
  name: string;
  order: number;
  activityGroupTargets: IActivityGroupTarget[];
  days: IDay[];
}

/**
 * Block - represents a training block within a program
 * Total fields: 5
 */
export interface IBlock {
  id: string;
  name: string;
  order: number;
  activityGroupTargets: IActivityGroupTarget[];
  weeks: IWeek[];
}

/**
 * Program Progress - tracks current position in program
 * Total fields: 6
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
 * Program - main program document
 * Top-level fields: 10
 */
export interface IProgram {
  id: string;
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

/**
 * Request DTOs
 */
export interface CreateProgramRequest {
  name: string;
  description?: string;
  gymId: string;
}

export interface UpdateProgramRequest {
  name?: string;
  description?: string;
  isActive?: boolean;
}

export interface ProgramListParams {
  gymId?: string;
  isActive?: boolean;
  createdBy?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface JumpToWeekRequest {
  blockIndex: number;
  weekIndex: number;
}

/**
 * Set Calculation - calculated weights for a single set in workout response
 */
export interface ISetCalculation {
  setNumber: number;            // 1-based index for display
  reps: number;
  percentageOfMax: number;
  calculatedWeightKg?: number;  // Based on benchmark
  benchmarkTemplateId?: string;  // Benchmark template used for this set
  benchmarkName?: string;        // Name of the benchmark template
}

/**
 * Workout Activity - extends IActivity with template info and calculated weights
 */
export interface WorkoutActivity extends IActivity {
  templateName: string;
  templateNotes?: string;
  benchmarkWeight?: number;
  recommendedWeight?: number;
  hasBenchmark?: boolean;
  durationMinutes?: number;
  description?: string;
  setCalculations?: ISetCalculation[];  // Per-set weight calculations for lifts
}

/**
 * Workout Day - extends IDay with WorkoutActivity instead of IActivity
 */
export interface WorkoutDay {
  id: string;
  name: string;
  order: number;
  activities: WorkoutActivity[];
}

/**
 * Current Week Workout Response - response from GET /api/me/workouts/current-week
 */
export interface CurrentWeekWorkoutResponse {
  success: true;
  data: {
    program: {
      id: string;
      name: string;
      description?: string;
    };
    currentBlock: {
      id: string;
      name: string;
      order: number;
    };
    currentWeek: {
      id: string;
      name: string;
      order: number;
      days: WorkoutDay[];
    };
    progress: {
      blockIndex: number;
      weekIndex: number;
      totalWeeksCompleted: number;
      startedAt: string;
    };
  };
}