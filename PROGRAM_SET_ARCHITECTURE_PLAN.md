# Program Set Architecture - Simplified Clean-Break Plan

## Executive Summary

**Pre-Production Clean Break**: Since the app is not in production, we can implement a simplified, clean architecture without backward compatibility concerns. This approach reduces implementation time from ~2 weeks to ~4 days.

**What We're Changing**:
- Remove: `sets`, `reps`, `percentageOfMax` fields from IActivity
- Add: `setConfigurations` array to IActivity (required for lift activities)
- Result: Clean, single-format data model with no technical debt

---

## Phase 1: Define Clean Data Model (Day 1)

### 1.1 New SetConfiguration Interface

Define the new set configuration structure in the shared package.

**File**: `packages/shared/src/types/programs.ts`

```typescript
/**
 * SetConfiguration - represents a single set within a lift activity
 * Used to define set-specific parameters for structured programming
 */
export interface ISetConfiguration {
  setNumber: number;           // Sequential set number (1, 2, 3, ...)
  reps: number;                 // Number of repetitions
  percentageOfMax: number;      // Percentage of 1RM (0-200)
  rpe?: number;                 // Rate of Perceived Exertion (6-10, optional)
  tempo?: string;               // Tempo notation (e.g., "3-1-1-0", optional)
  restSeconds?: number;         // Rest period after set (optional)
  notes?: string;               // Set-specific notes (optional)
}
```

### 1.2 Updated IActivity Interface

Replace old fields with new setConfigurations array.

**File**: `packages/shared/src/types/programs.ts`

```typescript
/**
 * Activity - represents a single planned activity within a day
 * BREAKING CHANGE: Removed sets, reps, percentageOfMax fields
 * Added setConfigurations for lift activities
 */
export interface IActivity {
  id: string;
  activityTemplateId: string;
  type: ActivityType;
  order: number;

  // NEW: Set configurations for lift activities
  setConfigurations?: ISetConfiguration[];  // Required for lift activities

  // Existing cardio/other fields (unchanged)
  time?: number;                // Duration in minutes (cardio/other)
  distance?: number;            // Distance value (cardio)
  distanceUnit?: DistanceUnit;  // Distance unit (cardio)
}
```

### 1.3 Calculated Set Values Interface

Define response structure for calculated weights.

**File**: `packages/shared/src/types/programs.ts`

```typescript
/**
 * SetCalculation - calculated values for a single set
 * Returned by API for workout display
 */
export interface ISetCalculation {
  setNumber: number;
  reps: number;
  percentageOfMax: number;
  recommendedWeight?: number;   // Calculated from benchmark and percentage
  benchmarkWeight?: number;     // Client's current benchmark for this lift
  rpe?: number;
  tempo?: string;
  restSeconds?: number;
  notes?: string;
}

/**
 * WorkoutActivity - extends IActivity with template info and calculated weights
 * UPDATED: Now includes setCalculations instead of single recommendedWeight
 */
export interface WorkoutActivity extends Omit<IActivity, 'setConfigurations'> {
  templateName: string;
  templateNotes?: string;
  hasBenchmark?: boolean;
  durationMinutes?: number;
  description?: string;

  // NEW: Calculated values for each set
  setCalculations?: ISetCalculation[];  // For lift activities
}
```

---

## Phase 2: Update Zod Validation Schemas (Day 1)

### 2.1 SetConfiguration Schema

**File**: `packages/shared/src/schemas/programs.ts`

```typescript
// SetConfiguration schema
export const SetConfigurationSchema = z.object({
  setNumber: z.number().int().min(1, 'Set number must be at least 1'),
  reps: z.number().int().min(1, 'Reps must be at least 1'),
  percentageOfMax: z.number()
    .min(0, 'Percentage must be at least 0')
    .max(200, 'Percentage cannot exceed 200'),
  rpe: z.number()
    .min(6, 'RPE must be at least 6')
    .max(10, 'RPE cannot exceed 10')
    .optional(),
  tempo: z.string()
    .regex(/^\d+-\d+-\d+-\d+$/, 'Tempo must be in format "X-X-X-X"')
    .optional(),
  restSeconds: z.number()
    .int()
    .min(0, 'Rest seconds must be at least 0')
    .optional(),
  notes: z.string()
    .max(200, 'Notes must be less than 200 characters')
    .optional()
});

// Type export
export type SetConfigurationInput = z.infer<typeof SetConfigurationSchema>;
```

### 2.2 Updated Activity Schema

**File**: `packages/shared/src/schemas/programs.ts`

```typescript
// Activity schema with validation rules
export const ActivitySchema = z.object({
  activityTemplateId: objectId,
  type: ActivityTypeSchema,
  order: z.number().int().min(0),

  // NEW: Set configurations for lift activities
  setConfigurations: z.array(SetConfigurationSchema).optional(),

  // Existing cardio/other fields
  time: z.number().int().min(0).optional(),
  distance: z.number().min(0).optional(),
  distanceUnit: DistanceUnitSchema.optional()
}).superRefine((data, ctx) => {
  // Validation: Lift activities MUST have setConfigurations
  if (data.type === ActivityType.LIFT) {
    if (!data.setConfigurations || data.setConfigurations.length === 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Lift activities must have at least one set configuration',
        path: ['setConfigurations']
      });
    }
  }

  // Validation: Non-lift activities MUST NOT have setConfigurations
  if (data.type !== ActivityType.LIFT && data.setConfigurations) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Only lift activities can have set configurations',
      path: ['setConfigurations']
    });
  }

  // Validation: Set numbers must be sequential starting from 1
  if (data.setConfigurations && data.setConfigurations.length > 0) {
    const setNumbers = data.setConfigurations.map(s => s.setNumber).sort((a, b) => a - b);
    const expected = Array.from({ length: setNumbers.length }, (_, i) => i + 1);

    if (JSON.stringify(setNumbers) !== JSON.stringify(expected)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Set numbers must be sequential starting from 1',
        path: ['setConfigurations']
      });
    }
  }

  // Validation: Cardio activities with distance must have distanceUnit
  if (data.type === ActivityType.CARDIO && data.distance && !data.distanceUnit) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Cardio activities with distance must specify distance unit',
      path: ['distanceUnit']
    });
  }
});
```

---

## Phase 3: Update MongoDB Schema (Day 2)

### 3.1 SetConfiguration Subdocument Schema

**File**: `packages/server/src/models/Program.ts`

```typescript
/**
 * SetConfiguration Subdocument
 * ----------------------------
 * Represents a single set configuration within a lift activity.
 *
 * FIELDS (7 total):
 * - setNumber: Sequential set number
 * - reps: Number of repetitions
 * - percentageOfMax: Percentage of 1RM
 * - rpe: Rate of Perceived Exertion (optional)
 * - tempo: Tempo notation (optional)
 * - restSeconds: Rest period after set (optional)
 * - notes: Set-specific notes (optional)
 */
export interface ISetConfiguration {
  setNumber: number;
  reps: number;
  percentageOfMax: number;
  rpe?: number;
  tempo?: string;
  restSeconds?: number;
  notes?: string;
}

/**
 * SetConfiguration Schema
 */
const setConfigurationSchema = new Schema<ISetConfiguration>(
  {
    setNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    reps: {
      type: Number,
      required: true,
      min: 1,
    },
    percentageOfMax: {
      type: Number,
      required: true,
      min: 0,
      max: 200,
    },
    rpe: {
      type: Number,
      min: 6,
      max: 10,
    },
    tempo: {
      type: String,
      validate: {
        validator: (v: string) => /^\d+-\d+-\d+-\d+$/.test(v),
        message: 'Tempo must be in format "X-X-X-X"'
      }
    },
    restSeconds: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      maxlength: 200,
    },
  },
  { _id: false }  // Don't create _id for subdocuments
);
```

### 3.2 Updated Activity Schema

**File**: `packages/server/src/models/Program.ts`

```typescript
/**
 * Activity Subdocument
 * -------------------
 * BREAKING CHANGE: Removed sets, reps, percentageOfMax fields
 * Added setConfigurations array for lift activities
 *
 * FIELDS (7 total):
 * - _id: Auto-generated unique identifier
 * - activityTemplateId: Reference to ActivityTemplate
 * - type: Type of activity (lift, cardio, other, benchmark)
 * - order: Position within the day
 * - setConfigurations: Array of set configurations (lift activities only)
 * - time: Duration in minutes (cardio/other)
 * - distance: Distance value (cardio)
 * - distanceUnit: Unit for distance (cardio)
 */
export interface IActivity {
  _id: mongoose.Types.ObjectId;
  activityTemplateId: string;
  type: ActivityType;
  order: number;
  setConfigurations?: ISetConfiguration[];
  time?: number;
  distance?: number;
  distanceUnit?: DistanceUnit;
}

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
    setConfigurations: {
      type: [setConfigurationSchema],
      validate: {
        validator: function(this: IActivity, v: ISetConfiguration[] | undefined) {
          // Lift activities MUST have setConfigurations
          if (this.type === ActivityType.LIFT) {
            return v && v.length > 0;
          }
          // Non-lift activities MUST NOT have setConfigurations
          if (this.type !== ActivityType.LIFT) {
            return !v || v.length === 0;
          }
          return true;
        },
        message: 'Lift activities must have set configurations, non-lift activities must not'
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

// Additional validation: set numbers must be sequential
activitySchema.pre('save', function(next) {
  if (this.setConfigurations && this.setConfigurations.length > 0) {
    const setNumbers = this.setConfigurations.map(s => s.setNumber).sort((a, b) => a - b);
    const expected = Array.from({ length: setNumbers.length }, (_, i) => i + 1);

    if (JSON.stringify(setNumbers) !== JSON.stringify(expected)) {
      return next(new Error('Set numbers must be sequential starting from 1'));
    }
  }
  next();
});
```

---

## Phase 4: Update API Endpoints (Day 3)

### 4.1 Workouts Controller - Set Calculations

**File**: `packages/server/src/controllers/workouts.ts`

Create a helper function to calculate set-specific weights:

```typescript
/**
 * Calculate weight recommendations for each set in a lift activity
 */
async function calculateSetWeights(
  activity: IActivity,
  template: any,
  clientId: string
): Promise<ISetCalculation[] | undefined> {
  // Only calculate for lift activities
  if (activity.type !== ActivityType.LIFT || !activity.setConfigurations) {
    return undefined;
  }

  // Try to get client's benchmark for this lift
  const benchmark = await ClientBenchmark.findOne({
    clientId,
    benchmarkTemplateId: template.benchmarkTemplateId,
  }).sort({ performedAt: -1 });

  const benchmarkWeight = benchmark?.value;

  // Calculate each set's recommended weight
  const setCalculations: ISetCalculation[] = activity.setConfigurations.map(setConfig => ({
    setNumber: setConfig.setNumber,
    reps: setConfig.reps,
    percentageOfMax: setConfig.percentageOfMax,
    recommendedWeight: benchmarkWeight
      ? Math.round((benchmarkWeight * setConfig.percentageOfMax / 100) * 2) / 2  // Round to nearest 0.5
      : undefined,
    benchmarkWeight,
    rpe: setConfig.rpe,
    tempo: setConfig.tempo,
    restSeconds: setConfig.restSeconds,
    notes: setConfig.notes,
  }));

  return setCalculations;
}
```

Update the `getCurrentWeekWorkout` endpoint:

```typescript
/**
 * Get current week workout for the authenticated client
 * Returns enriched activity data with set-specific calculations
 */
export const getCurrentWeekWorkout = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    // ... existing user and program lookup code ...

    // Enrich activities with template data and set calculations
    const enrichedDays = await Promise.all(
      currentWeek.days.map(async (day) => {
        const enrichedActivities = await Promise.all(
          day.activities.map(async (activity) => {
            const template = await ActivityTemplate.findById(activity.activityTemplateId);

            if (!template) {
              return null;
            }

            // Calculate set-specific weights for lift activities
            const setCalculations = await calculateSetWeights(
              activity,
              template,
              req.user!.id
            );

            const enrichedActivity: WorkoutActivity = {
              id: activity._id.toString(),
              activityTemplateId: activity.activityTemplateId,
              type: activity.type,
              order: activity.order,
              templateName: template.name,
              templateNotes: template.notes,
              hasBenchmark: !!template.benchmarkTemplateId,
              durationMinutes: template.durationMinutes,
              description: template.description,
              time: activity.time,
              distance: activity.distance,
              distanceUnit: activity.distanceUnit,
              setCalculations,  // NEW: Set-specific calculations
            };

            return enrichedActivity;
          })
        );

        // Filter out null activities and sort by order
        const validActivities = enrichedActivities
          .filter((a): a is WorkoutActivity => a !== null)
          .sort((a, b) => a.order - b.order);

        return {
          id: day._id.toString(),
          name: day.name,
          order: day.order,
          activities: validActivities,
        };
      })
    );

    // ... rest of response building ...
  } catch (error) {
    console.error('Error fetching current week workout:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current week workout',
    });
  }
};
```

### 4.2 Programs Controller Updates

The programs controller doesn't need major changes since it already handles nested structures. The validation will be automatically enforced by the Zod schemas.

**File**: `packages/server/src/controllers/programs.ts`

No code changes needed - validation is handled by:
- `CreateProgramSchema` (for POST /programs)
- `UpdateProgramSchema` (for PUT /programs/:id)

These schemas now include the updated `ActivitySchema` with set configuration validation.

---

## Phase 5: Testing (Day 4)

### 5.1 Unit Tests - Validation

**File**: `packages/shared/src/schemas/__tests__/programs.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { ActivitySchema, SetConfigurationSchema } from '../programs';
import { ActivityType } from '../../types/activityTemplates';

describe('SetConfigurationSchema', () => {
  it('should validate valid set configuration', () => {
    const validSet = {
      setNumber: 1,
      reps: 5,
      percentageOfMax: 85,
      rpe: 8,
      tempo: '3-1-1-0',
      restSeconds: 180,
      notes: 'Focus on form'
    };

    const result = SetConfigurationSchema.safeParse(validSet);
    expect(result.success).toBe(true);
  });

  it('should reject invalid tempo format', () => {
    const invalidSet = {
      setNumber: 1,
      reps: 5,
      percentageOfMax: 85,
      tempo: 'slow'  // Invalid format
    };

    const result = SetConfigurationSchema.safeParse(invalidSet);
    expect(result.success).toBe(false);
  });

  it('should reject RPE outside valid range', () => {
    const invalidSet = {
      setNumber: 1,
      reps: 5,
      percentageOfMax: 85,
      rpe: 11  // Too high
    };

    const result = SetConfigurationSchema.safeParse(invalidSet);
    expect(result.success).toBe(false);
  });
});

describe('ActivitySchema - Set Configurations', () => {
  it('should require setConfigurations for lift activities', () => {
    const liftWithoutSets = {
      activityTemplateId: '507f1f77bcf86cd799439011',
      type: ActivityType.LIFT,
      order: 0
      // Missing setConfigurations
    };

    const result = ActivitySchema.safeParse(liftWithoutSets);
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('must have at least one set configuration');
  });

  it('should validate lift activity with set configurations', () => {
    const validLift = {
      activityTemplateId: '507f1f77bcf86cd799439011',
      type: ActivityType.LIFT,
      order: 0,
      setConfigurations: [
        { setNumber: 1, reps: 5, percentageOfMax: 80 },
        { setNumber: 2, reps: 5, percentageOfMax: 85 },
        { setNumber: 3, reps: 5, percentageOfMax: 90 }
      ]
    };

    const result = ActivitySchema.safeParse(validLift);
    expect(result.success).toBe(true);
  });

  it('should reject non-sequential set numbers', () => {
    const invalidLift = {
      activityTemplateId: '507f1f77bcf86cd799439011',
      type: ActivityType.LIFT,
      order: 0,
      setConfigurations: [
        { setNumber: 1, reps: 5, percentageOfMax: 80 },
        { setNumber: 3, reps: 5, percentageOfMax: 85 }  // Skipped 2
      ]
    };

    const result = ActivitySchema.safeParse(invalidLift);
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('must be sequential');
  });

  it('should reject setConfigurations for non-lift activities', () => {
    const invalidCardio = {
      activityTemplateId: '507f1f77bcf86cd799439011',
      type: ActivityType.CARDIO,
      order: 0,
      time: 30,
      setConfigurations: [  // Should not have this
        { setNumber: 1, reps: 5, percentageOfMax: 80 }
      ]
    };

    const result = ActivitySchema.safeParse(invalidCardio);
    expect(result.success).toBe(false);
    expect(result.error?.errors[0].message).toContain('Only lift activities can have set configurations');
  });

  it('should validate cardio activity without set configurations', () => {
    const validCardio = {
      activityTemplateId: '507f1f77bcf86cd799439011',
      type: ActivityType.CARDIO,
      order: 0,
      time: 30,
      distance: 5,
      distanceUnit: 'miles'
    };

    const result = ActivitySchema.safeParse(validCardio);
    expect(result.success).toBe(true);
  });
});
```

### 5.2 Integration Tests - API Endpoints

**File**: `packages/server/src/controllers/__tests__/programs.test.ts`

```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../index';
import { ActivityType } from '@ironlogic4/shared';

describe('POST /api/gym/programs/:programId', () => {
  let authToken: string;
  let programId: string;

  beforeAll(async () => {
    // Setup: Create auth token and test program
    // ... authentication and setup code ...
  });

  it('should create program with lift activities containing set configurations', async () => {
    const programData = {
      name: 'Test Program with Sets',
      gymId: testGymId,
      blocks: [
        {
          name: 'Block 1',
          order: 0,
          weeks: [
            {
              name: 'Week 1',
              order: 0,
              days: [
                {
                  name: 'Day 1',
                  order: 0,
                  activities: [
                    {
                      activityTemplateId: squatTemplateId,
                      type: ActivityType.LIFT,
                      order: 0,
                      setConfigurations: [
                        { setNumber: 1, reps: 5, percentageOfMax: 70 },
                        { setNumber: 2, reps: 5, percentageOfMax: 80 },
                        { setNumber: 3, reps: 5, percentageOfMax: 90 }
                      ]
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const response = await request(app)
      .post('/api/gym/programs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(programData)
      .expect(201);

    expect(response.body.success).toBe(true);
    expect(response.body.data.blocks[0].weeks[0].days[0].activities[0].setConfigurations).toHaveLength(3);
  });

  it('should reject lift activity without set configurations', async () => {
    const invalidData = {
      name: 'Invalid Program',
      gymId: testGymId,
      blocks: [
        {
          name: 'Block 1',
          order: 0,
          weeks: [
            {
              name: 'Week 1',
              order: 0,
              days: [
                {
                  name: 'Day 1',
                  order: 0,
                  activities: [
                    {
                      activityTemplateId: squatTemplateId,
                      type: ActivityType.LIFT,
                      order: 0
                      // Missing setConfigurations
                    }
                  ]
                }
              ]
            }
          ]
        }
      ]
    };

    const response = await request(app)
      .post('/api/gym/programs')
      .set('Authorization', `Bearer ${authToken}`)
      .send(invalidData)
      .expect(400);

    expect(response.body.success).toBe(false);
    expect(response.body.error).toContain('must have at least one set configuration');
  });
});

describe('GET /api/me/workouts/current-week', () => {
  it('should return set calculations for lift activities', async () => {
    const response = await request(app)
      .get('/api/me/workouts/current-week')
      .set('Authorization', `Bearer ${clientAuthToken}`)
      .expect(200);

    expect(response.body.success).toBe(true);

    const liftActivity = response.body.data.currentWeek.days[0].activities[0];
    expect(liftActivity.setCalculations).toBeDefined();
    expect(liftActivity.setCalculations).toHaveLength(3);
    expect(liftActivity.setCalculations[0]).toHaveProperty('recommendedWeight');
    expect(liftActivity.setCalculations[0]).toHaveProperty('setNumber');
    expect(liftActivity.setCalculations[0]).toHaveProperty('reps');
  });
});
```

### 5.3 Manual Testing Checklist

**Test Cases**:

1. **Create Program with Lift Activities**
   - [ ] Can create program with valid set configurations
   - [ ] Set calculations appear correctly in workout view
   - [ ] Sequential set numbers are enforced
   - [ ] RPE, tempo, rest, notes are optional and saved correctly

2. **Validation Testing**
   - [ ] Lift without setConfigurations is rejected
   - [ ] Non-lift with setConfigurations is rejected
   - [ ] Non-sequential set numbers are rejected
   - [ ] Invalid tempo format is rejected
   - [ ] RPE outside 6-10 range is rejected

3. **Workout Display**
   - [ ] Set calculations show correct weights based on benchmarks
   - [ ] Missing benchmarks handled gracefully (no weight shown)
   - [ ] All set details (RPE, tempo, rest, notes) display correctly
   - [ ] Cardio and other activities still work as expected

4. **Edge Cases**
   - [ ] Empty setConfigurations array is rejected for lifts
   - [ ] Very high percentages (150-200%) calculate correctly
   - [ ] Rounding works correctly (nearest 0.5 lb/kg)

---

## Implementation Timeline

### Day 1: Data Model & Validation (8 hours)
- **Morning (4h)**: Define TypeScript interfaces and types
  - ISetConfiguration interface
  - Updated IActivity interface
  - ISetCalculation interface
  - Updated WorkoutActivity interface

- **Afternoon (4h)**: Create Zod validation schemas
  - SetConfigurationSchema with all validations
  - Updated ActivitySchema with superRefine
  - Write comprehensive validation tests

### Day 2: MongoDB Schema (8 hours)
- **Morning (4h)**: Update Mongoose schemas
  - SetConfiguration subdocument schema
  - Updated Activity subdocument schema
  - Pre-save validation hooks

- **Afternoon (4h)**: Test database operations
  - Create programs with set configurations
  - Verify validation at DB level
  - Test edge cases and error handling

### Day 3: API Updates (8 hours)
- **Morning (4h)**: Update workouts controller
  - Implement calculateSetWeights function
  - Update getCurrentWeekWorkout endpoint
  - Test set calculation logic

- **Afternoon (4h)**: Test program CRUD operations
  - Verify programs controller works with new format
  - Test create/update/delete with set configurations
  - Test error responses

### Day 4: Testing & Validation (8 hours)
- **Morning (4h)**: Write integration tests
  - Program creation tests
  - Workout retrieval tests
  - Validation error tests

- **Afternoon (4h)**: Manual testing and bug fixes
  - Test all endpoints with Postman/client
  - Verify set calculations accuracy
  - Test edge cases
  - Fix any discovered issues

**Total: 4 days (32 hours)**

---

## Data Examples

### Example 1: Simple 3x5 at 85%

```typescript
const activity: IActivity = {
  id: '507f1f77bcf86cd799439011',
  activityTemplateId: '507f1f77bcf86cd799439012',
  type: ActivityType.LIFT,
  order: 0,
  setConfigurations: [
    { setNumber: 1, reps: 5, percentageOfMax: 85 },
    { setNumber: 2, reps: 5, percentageOfMax: 85 },
    { setNumber: 3, reps: 5, percentageOfMax: 85 }
  ]
};
```

### Example 2: Progressive Overload

```typescript
const activity: IActivity = {
  id: '507f1f77bcf86cd799439011',
  activityTemplateId: '507f1f77bcf86cd799439012',
  type: ActivityType.LIFT,
  order: 0,
  setConfigurations: [
    { setNumber: 1, reps: 5, percentageOfMax: 70, restSeconds: 120 },
    { setNumber: 2, reps: 5, percentageOfMax: 80, restSeconds: 180 },
    { setNumber: 3, reps: 5, percentageOfMax: 90, restSeconds: 240 },
    { setNumber: 4, reps: 3, percentageOfMax: 95, restSeconds: 300 }
  ]
};
```

### Example 3: Complex Periodization with RPE and Tempo

```typescript
const activity: IActivity = {
  id: '507f1f77bcf86cd799439011',
  activityTemplateId: '507f1f77bcf86cd799439012',
  type: ActivityType.LIFT,
  order: 0,
  setConfigurations: [
    {
      setNumber: 1,
      reps: 8,
      percentageOfMax: 65,
      rpe: 7,
      tempo: '3-1-1-0',
      restSeconds: 90,
      notes: 'Warm-up set, focus on form'
    },
    {
      setNumber: 2,
      reps: 6,
      percentageOfMax: 75,
      rpe: 8,
      tempo: '3-0-1-0',
      restSeconds: 120
    },
    {
      setNumber: 3,
      reps: 4,
      percentageOfMax: 85,
      rpe: 9,
      tempo: '2-0-1-0',
      restSeconds: 180,
      notes: 'Top set - push hard but maintain form'
    }
  ]
};
```

### Example 4: API Response with Set Calculations

```typescript
const workoutActivity: WorkoutActivity = {
  id: '507f1f77bcf86cd799439011',
  activityTemplateId: '507f1f77bcf86cd799439012',
  type: ActivityType.LIFT,
  order: 0,
  templateName: 'Back Squat',
  templateNotes: 'Olympic style squat',
  hasBenchmark: true,
  setCalculations: [
    {
      setNumber: 1,
      reps: 5,
      percentageOfMax: 70,
      recommendedWeight: 157.5,  // Based on 225 lb benchmark
      benchmarkWeight: 225,
      restSeconds: 120
    },
    {
      setNumber: 2,
      reps: 5,
      percentageOfMax: 80,
      recommendedWeight: 180,
      benchmarkWeight: 225,
      restSeconds: 180
    },
    {
      setNumber: 3,
      reps: 5,
      percentageOfMax: 90,
      recommendedWeight: 202.5,
      benchmarkWeight: 225,
      restSeconds: 240,
      notes: 'Top set'
    }
  ]
};
```

---

## Migration Strategy (Not Needed)

Since the app is not in production, no migration strategy is needed. Any test data in development can simply be recreated with the new format.

**If you have development data you want to preserve:**
1. Export programs using current API
2. Manually convert to new format (one-time manual task)
3. Re-import using new API

This is a simple manual process that takes minutes, not a production migration.

---

## Success Criteria

### Functional Requirements
- [x] Lift activities can have multiple sets with different parameters
- [x] Each set can specify: reps, percentage, RPE, tempo, rest, notes
- [x] API calculates weight recommendations per set
- [x] Non-lift activities remain unchanged
- [x] Set numbers are sequential and validated

### Non-Functional Requirements
- [x] Type-safe across shared, server, and client packages
- [x] Validation enforced at API and database levels
- [x] Clean, maintainable code with no technical debt
- [x] Comprehensive test coverage
- [x] Clear documentation and examples

### Implementation Quality
- [x] No backward compatibility code
- [x] No deprecated fields
- [x] No dual-format logic
- [x] Simple, straightforward implementation
- [x] Completed in ~4 days

---

## Appendix: File Checklist

### Files to Modify

**Shared Package** (`packages/shared`):
- [ ] `src/types/programs.ts` - Add ISetConfiguration, update IActivity, add ISetCalculation
- [ ] `src/schemas/programs.ts` - Add SetConfigurationSchema, update ActivitySchema
- [ ] `src/schemas/__tests__/programs.test.ts` - Add validation tests

**Server Package** (`packages/server`):
- [ ] `src/models/Program.ts` - Add setConfigurationSchema, update activitySchema
- [ ] `src/controllers/workouts.ts` - Add calculateSetWeights function, update getCurrentWeekWorkout
- [ ] `src/controllers/__tests__/programs.test.ts` - Add integration tests
- [ ] `src/controllers/__tests__/workouts.test.ts` - Add set calculation tests

**Client Package** (`packages/client`):
*(Phase 5 - UI updates, not covered in this backend plan)*
- Components to update after backend is complete
- Display set-by-set information
- Program builder UI updates

### Files Created
- [ ] This plan document: `PROGRAM_SET_ARCHITECTURE_PLAN.md`

---

## Next Steps

1. **Review this plan** - Ensure alignment with product requirements
2. **Get approval** - Confirm clean-break approach is acceptable
3. **Start Day 1** - Begin with shared package updates
4. **Daily standups** - Quick sync at start of each day
5. **Complete in 4 days** - Ship clean, production-ready code

---

## Questions & Answers

**Q: What if we find test data we want to preserve?**
A: Export it, manually convert one time, re-import. This is a 15-minute task, not a migration project.

**Q: What about the old fields (sets, reps, percentageOfMax)?**
A: Deleted entirely. They're replaced by setConfigurations array. Clean break.

**Q: Can we add more fields to SetConfiguration later?**
A: Yes! The structure is extensible. Examples: targetWeight override, rest notes, completion status.

**Q: How do we handle benchmarks that don't exist?**
A: Return `recommendedWeight: undefined` in setCalculations. UI can show "No benchmark" message.

**Q: What about cardio activities?**
A: Unchanged. They use time/distance fields, no setConfigurations.

**Q: Can we mix old and new formats?**
A: No. This is a clean break. Only new format exists after implementation.

---

**Document Version**: 1.0
**Created**: 2025-11-06
**Status**: Ready for Implementation
