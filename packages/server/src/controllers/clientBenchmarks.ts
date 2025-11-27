import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { BenchmarkTemplate } from '../models/BenchmarkTemplate.js';
import { Types } from 'mongoose';
import {
  CreateMyBenchmarkInput,
  UpdateMyBenchmarkInput,
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

    res.status(200).json({
      success: true,
      data: {
        currentBenchmarks: userData.currentBenchmarks || [],
        historicalBenchmarks: userData.historicalBenchmarks || [],
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

/**
 * POST /api/me/benchmarks
 * Create new benchmark from template
 * Optionally moves an old benchmark to historical if oldBenchmarkId is provided
 */
export const createMyBenchmark = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;
    const input: CreateMyBenchmarkInput = req.body;

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

    // 3. If replacing an old benchmark, validate it exists and move it to historical
    if (input.oldBenchmarkId) {
      const user = await User.findById(userId);
      if (!user) {
        res.status(404).json({
          success: false,
          error: 'User not found',
        });
        return;
      }

      // Find the old benchmark in currentBenchmarks
      const oldBenchmark = user.currentBenchmarks?.find(
        (b) => b._id.toString() === input.oldBenchmarkId
      );

      if (!oldBenchmark) {
        res.status(404).json({
          success: false,
          error: 'Old benchmark not found in current benchmarks',
        });
        return;
      }

      // Move old benchmark to historical using atomic operation
      await User.findByIdAndUpdate(userId, {
        $pull: { currentBenchmarks: { _id: input.oldBenchmarkId } },
        $push: { historicalBenchmarks: oldBenchmark },
      });
    }

    // 4. Create new benchmark subdocument
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
      // Spread measurement field
      ...(input.repMaxes !== undefined && { repMaxes: input.repMaxes }),
      ...(input.timeSeconds !== undefined && { timeSeconds: input.timeSeconds }),
      ...(input.reps !== undefined && { reps: input.reps }),
      ...(input.otherNotes !== undefined && { otherNotes: input.otherNotes }),
    };

    // 5. Add to user's currentBenchmarks using atomic update
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        $push: { currentBenchmarks: newBenchmark },
      },
      { new: true, select: 'currentBenchmarks' }
    );

    if (!updatedUser) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // 6. Convert to JSON to trigger toJSON transform
    const userData = updatedUser.toJSON();

    // 7. Find the newly created benchmark
    const createdBenchmark = userData.currentBenchmarks?.find(
      (b: any) => b.id === newBenchmark._id.toString()
    );

    const message = input.oldBenchmarkId
      ? 'Benchmark created and old benchmark moved to historical'
      : 'Benchmark created successfully';

    res.status(201).json({
      success: true,
      data: {
        benchmark: createdBenchmark,
      },
      message,
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
    const input: UpdateMyBenchmarkInput = req.body;

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
 * Helper: Determine measurement type from input
 */
function getMeasurementTypeFromInput(input: CreateMyBenchmarkInput): string {
  if (input.repMaxes !== undefined && input.repMaxes.length > 0) return 'weight';
  if (input.timeSeconds !== undefined) return 'time';
  if (input.reps !== undefined) return 'reps';
  if (input.otherNotes !== undefined) return 'other';
  throw new Error('No valid measurement type found in input');
}