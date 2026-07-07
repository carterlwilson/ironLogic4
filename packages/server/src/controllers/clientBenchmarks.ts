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

function mergeRepMaxes(existing: any[], submitted: any[]): any[] {
  const merged = existing.map(toPlainObject);
  for (const s of submitted) {
    const idx = merged.findIndex(rm => rm.templateRepMaxId === s.templateRepMaxId);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], weightKg: s.weightKg, recordedAt: new Date(s.recordedAt) };
    } else {
      merged.push(s);
    }
  }
  return merged;
}

function mergeTimeSubMaxes(existing: any[], submitted: any[]): any[] {
  const merged = existing.map(toPlainObject);
  for (const s of submitted) {
    const idx = merged.findIndex(tsm => tsm.templateSubMaxId === s.templateSubMaxId);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], distanceMeters: s.distanceMeters, recordedAt: new Date(s.recordedAt) };
    } else {
      merged.push(s);
    }
  }
  return merged;
}

function mergeDistanceSubMaxes(existing: any[], submitted: any[]): any[] {
  const merged = existing.map(toPlainObject);
  for (const s of submitted) {
    const idx = merged.findIndex(dsm => dsm.templateDistanceSubMaxId === s.templateDistanceSubMaxId);
    if (idx >= 0) {
      merged[idx] = { ...merged[idx], timeSeconds: s.timeSeconds, recordedAt: new Date(s.recordedAt) };
    } else {
      merged.push(s);
    }
  }
  return merged;
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
      const createNewVersion = shouldCreateNewVersion(existingBenchmark, input);

      if (!createNewVersion) {
        // Edit-in-place: merge submitted sub-maxes into existing, leave others untouched
        const updateFields: any = { updatedAt: new Date() };

        if (input.repMaxes?.length) {
          updateFields['currentBenchmarks.$.repMaxes'] = mergeRepMaxes(
            existingBenchmark.repMaxes || [], input.repMaxes
          );
        }
        if (input.timeSubMaxes?.length) {
          updateFields['currentBenchmarks.$.timeSubMaxes'] = mergeTimeSubMaxes(
            existingBenchmark.timeSubMaxes || [], input.timeSubMaxes
          );
        }
        if (input.distanceSubMaxes?.length) {
          updateFields['currentBenchmarks.$.distanceSubMaxes'] = mergeDistanceSubMaxes(
            existingBenchmark.distanceSubMaxes || [], input.distanceSubMaxes
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

        const userData = updatedUser!.toJSON();
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

      // New-version path: merge submitted sub-maxes into old, archive old, create new
      const mergedRepMaxes = mergeRepMaxes(existingBenchmark.repMaxes || [], input.repMaxes || []);
      const mergedTimeSubMaxes = mergeTimeSubMaxes(existingBenchmark.timeSubMaxes || [], input.timeSubMaxes || []);
      const mergedDistanceSubMaxes = mergeDistanceSubMaxes(existingBenchmark.distanceSubMaxes || [], input.distanceSubMaxes || []);

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

      // Archive old benchmark
      await User.findByIdAndUpdate(userId, {
        $pull: { currentBenchmarks: { _id: existingBenchmark._id } },
        $push: { historicalBenchmarks: existingBenchmark },
      });

      // Push new benchmark
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { $push: { currentBenchmarks: newBenchmark } },
        { new: true, select: 'currentBenchmarks historicalBenchmarks' }
      );

      const userData = updatedUser!.toJSON();
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

    const updatedBenchmark = benchmarks?.find((b: any) => b.id === benchmarkId);

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

    const result = await User.updateOne(
      { _id: userId },
      {
        $pull: {
          currentBenchmarks: { _id: benchmarkId },
          historicalBenchmarks: { _id: benchmarkId },
        },
      }
    );

    if (result.modifiedCount === 0) {
      res.status(404).json({
        success: false,
        error: 'Benchmark not found',
      });
      return;
    }

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