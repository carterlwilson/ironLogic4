import mongoose, { Document, Schema } from 'mongoose';
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

// ============================================================================
// SUBDOCUMENT INTERFACES
// ============================================================================

/**
 * Set Subdocument
 * ----------------
 * Represents a single set within a lift activity.
 *
 * FIELDS (3 total):
 * - reps: Number of reps (1-100)
 * - percentageOfMax: Percentage of 1RM (0-200)
 * - benchmarkTemplateId: Optional reference to benchmark template for this set
 */
export interface ISet {
  reps: number;
  percentageOfMax: number;
  benchmarkTemplateId?: string;
}

/**
 * Activity Subdocument
 * -------------------
 * Represents a single planned activity within a day.
 *
 * FIELDS (8 total):
 * - _id: Auto-generated unique identifier
 * - activityTemplateId: Reference to ActivityTemplate
 * - type: Type of activity (lift, cardio, other, benchmark)
 * - order: Position within the day
 * - sets: Array of sets (required for lift activities)
 * - time: Duration in minutes (optional)
 * - distance: Distance value (optional)
 * - distanceUnit: Unit for distance (optional)
 */
export interface IActivity {
  _id: mongoose.Types.ObjectId;
  activityTemplateId: string;
  type: ActivityType;
  order: number;
  sets?: ISet[];
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

// ============================================================================
// MONGOOSE SCHEMAS
// ============================================================================

/**
 * Set Schema
 */
const setSchema = new Schema<ISet>(
  {
    reps: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    percentageOfMax: {
      type: Number,
      required: true,
      min: 0,
      max: 200,
    },
    benchmarkTemplateId: {
      type: String,
      ref: 'BenchmarkTemplate',
      required: false,
    },
  },
  { _id: false }
);

/**
 * Activity Schema
 */
const activitySchema = new Schema<IActivity>(
  {
    activityTemplateId: {
      type: String,
      ref: 'ActivityTemplate',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(ActivityType),
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    sets: {
      type: [setSchema],
      validate: {
        validator: function(sets: ISet[]) {
          if (sets && sets.length > 0) {
            return sets.length <= 20;
          }
          return true;
        },
        message: 'Cannot exceed 20 sets'
      }
    },
    time: {
      type: Number,
      min: 0,
    },
    distance: {
      type: Number,
      min: 0,
    },
    distanceUnit: {
      type: String,
      enum: Object.values(DistanceUnit),
    },
  },
  { _id: true }
);

/**
 * Pre-validation hook to ensure lift activities have sets array
 */
activitySchema.pre('validate', function(next) {
  const activity = this as any;

  // Lift activities MUST have sets array
  if (activity.type === ActivityType.LIFT) {
    if (!activity.sets || activity.sets.length === 0) {
      return next(new Error('Lift activities must have at least one set'));
    }
  }

  // Non-lift activities MUST NOT have sets array
  if (activity.type !== ActivityType.LIFT) {
    if (activity.sets && activity.sets.length > 0) {
      return next(new Error('Only lift activities can have sets'));
    }
  }

  next();
});

/**
 * Day Schema
 */
const daySchema = new Schema<IDay>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    activities: {
      type: [activitySchema],
      required: true,
      default: [],
    },
  },
  { _id: true }
);

/**
 * ActivityGroupTarget Schema
 */
const activityGroupTargetSchema = new Schema<IActivityGroupTarget>(
  {
    activityGroupId: {
      type: String,
      ref: 'ActivityGroup',
      required: true,
    },
    targetPercentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
  },
  { _id: false }
);

/**
 * Week Schema
 */
const weekSchema = new Schema<IWeek>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    activityGroupTargets: {
      type: [activityGroupTargetSchema],
      required: true,
      default: [],
    },
    days: {
      type: [daySchema],
      required: true,
      default: [],
    },
  },
  { _id: true }
);

/**
 * Block Schema
 */
const blockSchema = new Schema<IBlock>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    activityGroupTargets: {
      type: [activityGroupTargetSchema],
      required: true,
      default: [],
    },
    weeks: {
      type: [weekSchema],
      required: true,
      default: [],
    },
  },
  { _id: true }
);

/**
 * Program Progress Schema
 */
const programProgressSchema = new Schema<IProgramProgress>(
  {
    blockIndex: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    weekIndex: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
    lastAdvancedAt: {
      type: Date,
      default: null,
    },
    totalWeeksCompleted: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
  },
  { _id: false }
);

/**
 * Program Schema
 * -------------
 * Main schema for the Program model.
 *
 * INDEXES:
 * - name: For search functionality
 * - gymId: For gym-based queries
 * - gymId + isActive: For finding active programs in a gym
 * - createdBy: For finding programs created by a specific user
 */
const programSchema = new Schema<ProgramDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    gymId: {
      type: String,
      ref: 'Gym',
      required: true,
      index: true,
    },
    createdBy: {
      type: String,
      ref: 'User',
      required: true,
      index: true,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: true,
      index: true,
    },
    blocks: {
      type: [blockSchema],
      required: true,
      default: [],
    },
    currentProgress: {
      type: programProgressSchema,
      required: true,
      default: () => ({
        blockIndex: 0,
        weekIndex: 0,
        startedAt: null,
        completedAt: null,
        lastAdvancedAt: null,
        totalWeeksCompleted: 0,
      }),
    },
  },
  {
    timestamps: true,
  }
);

// ============================================================================
// INDEXES
// ============================================================================

programSchema.index({ name: 1 });
programSchema.index({ gymId: 1, isActive: 1 });
programSchema.index({ gymId: 1, createdBy: 1 });

// ============================================================================
// JSON TRANSFORMATION
// ============================================================================

/**
 * Helper function to recursively transform _id to id in nested objects
 */
function transformIds(obj: any): any {
  // Return primitives as-is
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  // Preserve Date objects - DON'T transform them
  if (obj instanceof Date) {
    return obj;
  }

  // Preserve Buffer objects (from ObjectIds that weren't converted properly)
  if (Buffer.isBuffer(obj)) {
    return obj.toString('hex');
  }

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformIds(item));
  }

  // Handle Mongoose ObjectIds directly
  if (obj.constructor && obj.constructor.name === 'ObjectID') {
    return obj.toString();
  }

  // Handle objects
  const transformed: any = {};
  for (const key in obj) {
    if (!obj.hasOwnProperty(key)) continue; // Skip inherited properties

    if (key === '_id' && obj[key]) {
      transformed.id = obj[key].toString();
    } else if (key === '__v') {
      // Skip version key
      continue;
    } else {
      transformed[key] = transformIds(obj[key]);
    }
  }
  return transformed;
}

/**
 * Transform _id to id when converting to JSON
 * This provides a consistent API response format
 * Recursively transforms all nested subdocuments
 */
programSchema.set('toJSON', {
  transform: function (doc, ret) {
    return transformIds(ret);
  },
});

// ============================================================================
// MIDDLEWARE - CASCADE OPERATIONS
// ============================================================================

/**
 * Pre-delete hook to unassign program from all clients
 * When a program is deleted, set programId to null for all users assigned to it
 */
programSchema.pre(['deleteOne', 'findOneAndDelete'], async function(next) {
  try {
    const programId = this.getQuery()._id;

    // Import User model dynamically to avoid circular dependency
    const User = mongoose.model('User');

    // Unassign this program from all clients
    await User.updateMany(
      { programId: programId },
      { $unset: { programId: 1 } }
    );

    next();
  } catch (error) {
    next(error as Error);
  }
});

// ============================================================================
// MODEL EXPORT
// ============================================================================

export const Program = mongoose.model<ProgramDocument>('Program', programSchema);