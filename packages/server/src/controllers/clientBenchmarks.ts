import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { BenchmarkTemplate } from '../models/BenchmarkTemplate.js';
import { Types } from 'mongoose';
import {
  CreateMyBenchmarkInput,
  UpdateMyBenchmarkInput,
  CreateMyBenchmarkSchema,
  UpdateMyBenchmarkSchema,
} from '@ironlogic4/shared';

/**
 * GET /api/me/benchmarks
 * Get authenticated client's benchmarks
 */
export const getMyBenchmarks = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    const user = await User.findById(userId)
      .select('currentBenchmarks historicalBenchmarks');

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    const userData = user.toJSON();

    // Collect all benchmarks to extract template IDs
    const allBenchmarks = [
      ...(userData.currentBenchmarks || []),
      ...(userData.historicalBenchmarks || [])
    ];

    // Extract unique template IDs
    const templateIds = [...new Set(allBenchmarks.map((b: any) => b.templateId))];

    // Fetch all templates in ONE query (fixes N+1 problem)
    const templates = await BenchmarkTemplate.find({
      _id: { $in: templateIds }
    });

    res.status(200).json({
      success: true,
      data: {
        currentBenchmarks: userData.currentBenchmarks || [],
        historicalBenchmarks: userData.historicalBenchmarks || [],
        templates: templates.map(t => t.toJSON()),
      },
    });
  } catch (error) {
    console.error('Error fetching client benchmarks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benchmarks',
    });
  }
};

const FIVE_DAYS_MS = 5 * 24 * 60 * 60 * 1000;

function shouldCreateNewVersion(existing: any, input: CreateMyBenchmarkInput): boolean {
  const now = Date.now();

  if (input.repMaxes?.length) {
    return input.repMaxes.some(submitted => {
      const counterpart = existing.repMaxes?.find(
        (rm: any) => rm.templateRepMaxId === submitted.templateRepMaxId
      );
      return counterpart && (now - new Date(counterpart.recordedAt).getTime()) >= FIVE_DAYS_MS;
    });
  }

  if (input.timeSubMaxes?.length) {
    return input.timeSubMaxes.some(submitted => {
      const counterpart = existing.timeSubMaxes?.find(
        (tsm: any) => tsm.templateSubMaxId === submitted.templateSubMaxId
      );
      return counterpart && (now - new Date(counterpart.recordedAt).getTime()) >= FIVE_DAYS_MS;
    });
  }

  if (input.distanceSubMaxes?.length) {
    return input.distanceSubMaxes.some(submitted => {
      const counterpart = existing.distanceSubMaxes?.find(
        (dsm: any) => dsm.templateDistanceSubMaxId === submitted.templateDistanceSubMaxId
      );
      return counterpart && (now - new Date(counterpart.recordedAt).getTime()) >= FIVE_DAYS_MS;
    });
  }

  // Scalar types: use benchmark-level recordedAt
  if (existing.recordedAt) {
    return (now - new Date(existing.recordedAt).getTime()) >= FIVE_DAYS_MS;
  }
  return false;
}

// Mongoose subdocuments store their data on a hidden `_doc` property rather than as
// own enumerable properties, so spreading one directly (`{...subdoc}`) silently drops
// its fields when later cast by Mongoose during a $push/$set update. Convert to a plain
// object first so overrides actually stick.
function toPlainObject(doc: any): any {
  return typeof doc?.toObject === 'function' ? doc.toObject() : doc;
}

function mergeSubMaxes(existing: any[], submitted: any[], idField: string, valueField: string): any[] {
  const merged = existing.map(toPlainObject);
  for (const s of submitted) {
    const idx = merged.findIndex(item => item[idField] === s[idField]);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], [valueField]: s[valueField], recordedAt: new Date(s.recordedAt) };
    } else {
      merged.push(s);
    }
  }
  return merged;
}

// A rep max with fewer reps must be >= one with more reps (if you can lift X for 5 reps,
// you can lift at least X for 1 rep). When the user submits a value, treat it as ground
// truth and raise any other, untouched bucket that's now known to be too low relative to it.
// Buckets are never lowered automatically: a new, lower-rep submission that's smaller than an
// existing higher-rep-count value is left as-is rather than silently overwritten — clamping
// downward previously caused real historical maxes to be erased without the user's knowledge.
function normalizeRepMaxes(
  merged: any[],
  repsById: Map<string, number>,
  authoritativeIds: Set<string>
): any[] {
  const authoritative = merged.filter(rm => authoritativeIds.has(rm.templateRepMaxId));
  if (authoritative.length === 0) return merged;

  const now = new Date();

  return merged.map(rm => {
    if (authoritativeIds.has(rm.templateRepMaxId)) return rm;
    const reps = repsById.get(rm.templateRepMaxId);
    if (reps === undefined) return rm;

    let lowerBound = -Infinity; // must be >= weight of any authoritative entry with MORE reps
    for (const a of authoritative) {
      const aReps = repsById.get(a.templateRepMaxId);
      if (aReps === undefined) continue;
      if (aReps > reps) lowerBound = Math.max(lowerBound, a.weightKg);
    }

    if (lowerBound > -Infinity && rm.weightKg < lowerBound) {
      return { ...rm, weightKg: lowerBound, recordedAt: now };
    }
    return rm;
  });
}

/**
 * POST /api/me/benchmarks
 * Create new benchmark from template.
 * Server automatically routes to edit-in-place or new-version based on sub-max age.
 */
export const createMyBenchmark = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const bodyValidation = CreateMyBenchmarkSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid benchmark data', details: bodyValidation.error.errors });
      return;
    }
    const input: CreateMyBenchmarkInput = bodyValidation.data;

    // 1. Validate template exists
    const template = await BenchmarkTemplate.findById(input.templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Benchmark template not found',
      });
      return;
    }

    // 2. Validate measurement type matches template
    const measurementType = getMeasurementTypeFromInput(input);
    if (measurementType !== template.type) {
      res.status(400).json({
        success: false,
        error: `This template requires a ${template.type} measurement`,
      });
      return;
    }

    // 3. Load user and find existing currentBenchmark for this template
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const existingBenchmark = user.currentBenchmarks?.find(
      (b) => b.templateId.toString() === input.templateId
    );

    if (existingBenchmark) {
      // Compute the repMax merge/normalization once up front so we can tell whether
      // normalizeRepMaxes is about to silently rewrite an untouched bucket. If it is,
      // that bucket's prior value needs a home in history — the only place this app
      // has for that is a full-benchmark archival, so such an adjustment must force
      // the new-version path regardless of the submitted bucket's own staleness.
      let mergedRepMaxes: any[] = (existingBenchmark.repMaxes || []).map(toPlainObject);
      let repMaxesWereAdjusted = false;
      if (input.repMaxes?.length) {
        const repsById = new Map((template.templateRepMaxes || []).map((trm: any) => [trm._id.toString(), trm.reps]));
        const authoritativeIds = new Set(input.repMaxes.map(rm => rm.templateRepMaxId));
        const merged = mergeSubMaxes(existingBenchmark.repMaxes || [], input.repMaxes, 'templateRepMaxId', 'weightKg');
        mergedRepMaxes = normalizeRepMaxes(merged, repsById, authoritativeIds);
        repMaxesWereAdjusted = mergedRepMaxes.some((rm, i) => rm.weightKg !== merged[i].weightKg);
      }

      const createNewVersion = shouldCreateNewVersion(existingBenchmark, input) || repMaxesWereAdjusted;

      if (!createNewVersion) {
        // Edit-in-place: merge submitted sub-maxes into existing, leave others untouched
        const updateFields: any = { 'currentBenchmarks.$.updatedAt': new Date() };

        if (input.repMaxes?.length) {
          updateFields['currentBenchmarks.$.repMaxes'] = mergedRepMaxes;
        }
        if (input.timeSubMaxes?.length) {
          updateFields['currentBenchmarks.$.timeSubMaxes'] = mergeSubMaxes(
            existingBenchmark.timeSubMaxes || [], input.timeSubMaxes, 'templateSubMaxId', 'distanceMeters'
          );
        }
        if (input.distanceSubMaxes?.length) {
          updateFields['currentBenchmarks.$.distanceSubMaxes'] = mergeSubMaxes(
            existingBenchmark.distanceSubMaxes || [], input.distanceSubMaxes, 'templateDistanceSubMaxId', 'timeSeconds'
          );
        }
        if (input.timeSeconds !== undefined) updateFields['currentBenchmarks.$.timeSeconds'] = input.timeSeconds;
        if (input.reps !== undefined) updateFields['currentBenchmarks.$.reps'] = input.reps;
        if (input.otherNotes !== undefined) updateFields['currentBenchmarks.$.otherNotes'] = input.otherNotes;
        if (input.recordedAt) updateFields['currentBenchmarks.$.recordedAt'] = new Date(input.recordedAt);
        if (input.notes !== undefined) updateFields['currentBenchmarks.$.notes'] = input.notes;

        const updatedUser = await User.findOneAndUpdate(
          { _id: userId, 'currentBenchmarks._id': existingBenchmark._id },
          { $set: updateFields },
          { new: true, select: 'currentBenchmarks historicalBenchmarks' }
        );

        if (!updatedUser) {
          res.status(404).json({ success: false, error: 'Benchmark not found or was modified concurrently' });
          return;
        }

        const userData = updatedUser.toJSON();
        res.status(200).json({
          success: true,
          data: {
            currentBenchmarks: userData.currentBenchmarks || [],
            historicalBenchmarks: userData.historicalBenchmarks || [],
          },
          message: 'Benchmark updated in place',
        });
        return;
      }

      // New-version path: merge submitted sub-maxes into old, archive old, create new.
      // mergedRepMaxes was already computed above (hoisted so we could tell whether an
      // adjustment happened before deciding on this path).
      const mergedTimeSubMaxes = mergeSubMaxes(existingBenchmark.timeSubMaxes || [], input.timeSubMaxes || [], 'templateSubMaxId', 'distanceMeters');
      const mergedDistanceSubMaxes = mergeSubMaxes(existingBenchmark.distanceSubMaxes || [], input.distanceSubMaxes || [], 'templateDistanceSubMaxId', 'timeSeconds');

      const newBenchmark = {
        _id: new Types.ObjectId(),
        templateId: template.id,
        name: template.name,
        type: template.type,
        tags: template.tags || [],
        notes: input.notes,
        recordedAt: input.recordedAt ? new Date(input.recordedAt) : undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
        ...(mergedRepMaxes.length > 0 && { repMaxes: mergedRepMaxes }),
        ...(mergedTimeSubMaxes.length > 0 && { timeSubMaxes: mergedTimeSubMaxes }),
        ...(mergedDistanceSubMaxes.length > 0 && { distanceSubMaxes: mergedDistanceSubMaxes }),
        ...(input.timeSeconds !== undefined && { timeSeconds: input.timeSeconds }),
        ...(input.reps !== undefined && { reps: input.reps }),
        ...(input.otherNotes !== undefined && { otherNotes: input.otherNotes }),
      };

      // Archive old benchmark and add the new one in a single atomic update so there's
      // no window where the old version is removed but the new one isn't in place yet.
      const newCurrentBenchmarks = (user.currentBenchmarks || [])
        .filter(b => b._id.toString() !== existingBenchmark._id.toString())
        .map(toPlainObject)
        .concat([newBenchmark]);

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: { currentBenchmarks: newCurrentBenchmarks },
          $push: { historicalBenchmarks: existingBenchmark },
        },
        { new: true, select: 'currentBenchmarks historicalBenchmarks' }
      );

      if (!updatedUser) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const userData = updatedUser.toJSON();
      res.status(201).json({
        success: true,
        data: {
          currentBenchmarks: userData.currentBenchmarks || [],
          historicalBenchmarks: userData.historicalBenchmarks || [],
        },
        message: 'New benchmark version created',
      });
      return;
    }

    // No existing benchmark — create fresh
    const newBenchmark = {
      _id: new Types.ObjectId(),
      templateId: template.id,
      name: template.name,
      type: template.type,
      tags: template.tags || [],
      notes: input.notes,
      recordedAt: input.recordedAt ? new Date(input.recordedAt) : undefined,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...(input.repMaxes !== undefined && { repMaxes: input.repMaxes }),
      ...(input.timeSubMaxes !== undefined && { timeSubMaxes: input.timeSubMaxes }),
      ...(input.distanceSubMaxes !== undefined && { distanceSubMaxes: input.distanceSubMaxes }),
      ...(input.timeSeconds !== undefined && { timeSeconds: input.timeSeconds }),
      ...(input.reps !== undefined && { reps: input.reps }),
      ...(input.otherNotes !== undefined && { otherNotes: input.otherNotes }),
    };

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { $push: { currentBenchmarks: newBenchmark } },
      { new: true, select: 'currentBenchmarks historicalBenchmarks' }
    );

    if (!updatedUser) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const userData = updatedUser.toJSON();
    res.status(201).json({
      success: true,
      data: {
        currentBenchmarks: userData.currentBenchmarks || [],
        historicalBenchmarks: userData.historicalBenchmarks || [],
      },
      message: 'Benchmark created successfully',
    });
  } catch (error) {
    console.error('Error creating benchmark:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create benchmark',
    });
  }
};

/**
 * PUT /api/me/benchmarks/:benchmarkId
 * Update existing benchmark
 */
export const updateMyBenchmark = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { benchmarkId } = req.params;
    const bodyValidation = UpdateMyBenchmarkSchema.safeParse(req.body);
    if (!bodyValidation.success) {
      res.status(400).json({ success: false, error: 'Invalid benchmark data', details: bodyValidation.error.errors });
      return;
    }
    const input: UpdateMyBenchmarkInput = bodyValidation.data;

    // 1. Find user and locate benchmark
    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // 2. Find benchmark in current or historical
    let benchmarkLocation: 'current' | 'historical' | null = null;

    const currentIndex = user.currentBenchmarks?.findIndex(
      (b) => b._id.toString() === benchmarkId
    ) ?? -1;

    if (currentIndex !== -1) {
      benchmarkLocation = 'current';
    } else {
      const historicalIndex = user.historicalBenchmarks?.findIndex(
        (b) => b._id.toString() === benchmarkId
      ) ?? -1;

      if (historicalIndex !== -1) {
        benchmarkLocation = 'historical';
      }
    }

    if (!benchmarkLocation) {
      res.status(404).json({
        success: false,
        error: 'Benchmark not found',
      });
      return;
    }

    // 3. Build update object (only allowed fields)
    const updateFields: any = {
      updatedAt: new Date(),
    };

    if (input.recordedAt) {
      updateFields.recordedAt = new Date(input.recordedAt);
    }
    if (input.notes !== undefined) {
      updateFields.notes = input.notes;
    }
    if (input.repMaxes !== undefined) {
      updateFields.repMaxes = input.repMaxes;
    }
    if (input.timeSubMaxes !== undefined) {
      updateFields.timeSubMaxes = input.timeSubMaxes;
    }
    if (input.distanceSubMaxes !== undefined) {
      updateFields.distanceSubMaxes = input.distanceSubMaxes;
    }
    if (input.timeSeconds !== undefined) {
      updateFields.timeSeconds = input.timeSeconds;
    }
    if (input.reps !== undefined) {
      updateFields.reps = input.reps;
    }
    if (input.otherNotes !== undefined) {
      updateFields.otherNotes = input.otherNotes;
    }

    // 4. Update using MongoDB array update operator
    const arrayField =
      benchmarkLocation === 'current' ? 'currentBenchmarks' : 'historicalBenchmarks';

    const updateQuery: any = {};
    Object.keys(updateFields).forEach((key) => {
      updateQuery[`${arrayField}.$.${key}`] = updateFields[key];
    });

    const updatedUser = await User.findOneAndUpdate(
      {
        _id: userId,
        [`${arrayField}._id`]: benchmarkId,
      },
      { $set: updateQuery },
      { new: true, select: arrayField }
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'Failed to update benchmark',
      });
      return;
    }

    // 5. Convert to JSON to trigger toJSON transform
    const userData = updatedUser.toJSON();

    // 6. Find updated benchmark
    const benchmarks =
      benchmarkLocation === 'current'
        ? userData.currentBenchmarks
        : userData.historicalBenchmarks;

    const updatedBenchmark = benchmarks?.find((b: any) => b.id?.toString() === benchmarkId);

    res.status(200).json({
      success: true,
      data: {
        benchmark: updatedBenchmark,
      },
      message: 'Benchmark updated successfully',
    });
  } catch (error) {
    console.error('Error updating benchmark:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update benchmark',
    });
  }
};

/**
 * DELETE /api/me/benchmarks/:benchmarkId
 * Delete a benchmark (current or historical) and all its submaxes
 */
export const deleteMyBenchmark = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { benchmarkId } = req.params;

    // MongoDB's $pull across two array fields in one update reports modifiedCount:1 even when
    // neither array had a matching element, so existence must be checked explicitly beforehand
    // rather than inferred from the update result.
    const user = await User.findById(userId).select('currentBenchmarks historicalBenchmarks');
    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    const exists =
      user.currentBenchmarks?.some((b) => b._id.toString() === benchmarkId) ||
      user.historicalBenchmarks?.some((b) => b._id.toString() === benchmarkId);

    if (!exists) {
      res.status(404).json({
        success: false,
        error: 'Benchmark not found',
      });
      return;
    }

    await User.updateOne(
      { _id: userId },
      {
        $pull: {
          currentBenchmarks: { _id: benchmarkId },
          historicalBenchmarks: { _id: benchmarkId },
        },
      }
    );

    res.status(200).json({
      success: true,
      message: 'Benchmark deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting benchmark:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete benchmark',
    });
  }
};

/**
 * Helper: Determine measurement type from input
 */
function getMeasurementTypeFromInput(input: CreateMyBenchmarkInput): string {
  if (input.repMaxes !== undefined && input.repMaxes.length > 0) return 'weight';
  if (input.timeSubMaxes !== undefined && input.timeSubMaxes.length > 0) return 'distance';
  if (input.distanceSubMaxes !== undefined && input.distanceSubMaxes.length > 0) return 'time';
  if (input.timeSeconds !== undefined) return 'time';
  if (input.reps !== undefined) return 'reps';
  if (input.otherNotes !== undefined) return 'other';
  throw new Error('No valid measurement type found in input');
}