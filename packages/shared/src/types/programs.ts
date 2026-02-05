import { ActivityType } from './activityTemplates.js';

export enum DistanceUnit {
  MILES = 'miles',
  KILOMETERS = 'kilometers',
  METERS = 'meters',
  YARDS = 'yards'
}

export enum CardioType {
  TIME = 'time',           // Fixed duration in minutes
  DISTANCE = 'distance',   // Fixed distance
  REPETITIONS = 'reps'     // Fixed number of reps (burpees, box jumps, etc.)
}

/**
 * Set - represents a single set within a lift activity
 * Total fields: 3
 */
export interface ISet {
  reps: number;              // 1-100
  percentageOfMax: number;   // 0-200
  templateRepMaxId?: string; // Optional reference to TemplateRepMax for this set
}

/**
 * Activity - represents a single planned activity within a day
 * Total fields: 12
 */
export interface IActivity {
  id: string;
  activityTemplateId: string;
  type: ActivityType;
  order: number;

  // Lift-specific
  sets?: ISet[];  // Array of sets (required for lift activities)

  // Cardio-specific
  cardioType?: CardioType;           // Time, Distance, or Reps
  time?: number;                      // Duration in minutes
  distance?: number;                  // Distance value
  distanceUnit?: DistanceUnit;        // miles, km, meters, yards
  repetitions?: number;               // Number of reps (burpees, etc.)

  // Benchmark mode (any cardio type)
  templateSubMaxId?: string;          // Reference to benchmark sub-max for cardio activities
  percentageOfMax?: number;           // Percentage of benchmark (0-200)
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
  templateRepMaxId?: string;     // TemplateRepMax being used
  benchmarkName?: string;        // Full name: "Back Squat - 3RM"
  repMaxReps?: number;           // The rep count (e.g., 3 for 3RM)
}

/**
 * Workout Activity - extends IActivity with template info and calculated weights/distances
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
  // Cardio fields (inherited from IActivity: cardioType, repetitions)
  // Cardio benchmark fields
  calculatedDistanceMeters?: number | null;  // Calculated distance for DISTANCE benchmark-based cardio
  calculatedTimeSeconds?: number | null;     // Calculated time for TIME benchmark-based cardio
  benchmarkName?: string | null;             // Full name: "Row - 3 min" or "500m Row - 500m"
  intervalName?: string | null;              // Time interval name: "3 min"
  distanceInterval?: string;                 // Distance interval name for TIME benchmarks: "500m"
  cardioDistanceUnit?: string;               // Distance unit from benchmark template (kilometers, miles, meters, yards)
  error?: string;                            // Error message if benchmark not found
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