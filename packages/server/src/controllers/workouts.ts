import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Program } from '../models/Program.js';
import { ActivityTemplate } from '../models/ActivityTemplate.js';
import { BenchmarkTemplate } from '../models/BenchmarkTemplate.js';
import { BenchmarkType } from '@ironlogic4/shared';

/**
 * Helper function to round weight to nearest 0.5 kg increment
 */
function roundToHalf(value: number): number {
  return Math.round(value * 2) / 2;
}

/**
 * GET /api/me/workouts/current-week
 * Get current week's workout plan with pre-calculated weights
 */
export const getCurrentWeekWorkouts = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const userId = req.user!.id;

    // 1. Get user with current benchmarks
    const user = await User.findById(userId)
      .select('programId currentBenchmarks')
      .lean();

    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // 2. Check if user has a program assigned
    if (!user.programId) {
      res.status(404).json({
        success: false,
        error: 'No program assigned',
      });
      return;
    }

    // 3. Get program with lean query for performance
    const program = await Program.findById(user.programId)
      .select('name description blocks currentProgress')
      .lean();

    if (!program) {
      res.status(404).json({
        success: false,
        error: 'Program not found',
      });
      return;
    }

    // 4. Check if program has been started
    if (!program.currentProgress.startedAt) {
      res.status(400).json({
        success: false,
        error: 'Program has not been started yet',
      });
      return;
    }

    // 5. Check if program is completed
    if (program.currentProgress.completedAt) {
      res.status(400).json({
        success: false,
        error: 'Program has been completed',
      });
      return;
    }

    // 6. Get current block and week
    const { blockIndex, weekIndex } = program.currentProgress;

    if (!program.blocks || program.blocks.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Program has no blocks',
      });
      return;
    }

    const currentBlock = program.blocks[blockIndex];
    if (!currentBlock) {
      res.status(400).json({
        success: false,
        error: 'Current block not found',
      });
      return;
    }

    if (!currentBlock.weeks || currentBlock.weeks.length === 0) {
      res.status(400).json({
        success: false,
        error: 'Current block has no weeks',
      });
      return;
    }

    const currentWeek = currentBlock.weeks[weekIndex];
    if (!currentWeek) {
      res.status(400).json({
        success: false,
        error: 'Current week not found',
      });
      return;
    }

    // 7. Collect all unique activity template IDs across all days
    const activityTemplateIds = new Set<string>();
    currentWeek.days.forEach(day => {
      day.activities.forEach(activity => {
        activityTemplateIds.add(activity.activityTemplateId);
      });
    });

    // 8. Bulk fetch all activity templates
    const activityTemplates = await ActivityTemplate.find({
      _id: { $in: Array.from(activityTemplateIds) }
    })
      .select('name notes type benchmarkTemplateId')
      .lean();

    // Create a map for quick lookup
    const templateMap = new Map(
      activityTemplates.map(template => [template._id.toString(), template])
    );

    // 9. Collect all unique benchmark template IDs
    const benchmarkTemplateIds = new Set<string>();

    // Add benchmark template IDs from activity templates
    activityTemplates.forEach(template => {
      if (template.benchmarkTemplateId) {
        benchmarkTemplateIds.add(template.benchmarkTemplateId);
      }
    });

    // Add benchmark template IDs from user's current benchmarks
    (user.currentBenchmarks || []).forEach(benchmark => {
      benchmarkTemplateIds.add(benchmark.templateId);
    });

    // 10. Bulk fetch all benchmark templates to get names
    const benchmarkTemplates = await BenchmarkTemplate.find({
      _id: { $in: Array.from(benchmarkTemplateIds) }
    })
      .select('name')
      .lean();

    // Create a map for benchmark template names
    const benchmarkTemplateNameMap = new Map<string, string>(
      benchmarkTemplates.map((template: { _id: { toString: () => string }; name: string }) => [
        template._id.toString(),
        template.name
      ])
    );

    // 11. Create benchmark lookup map
    const benchmarkMap = new Map(
      (user.currentBenchmarks || []).map(benchmark => [
        benchmark.templateId,
        benchmark
      ])
    );

    // 12. Transform days with enriched activities
    const enrichedDays = currentWeek.days.map(day => {
      const enrichedActivities = day.activities.map(activity => {
        const template = templateMap.get(activity.activityTemplateId);

        if (!template) {
          return {
            id: activity._id.toString(),
            activityTemplateId: activity.activityTemplateId,
            type: activity.type,
            order: activity.order,
            sets: activity.sets,
            reps: activity.reps,
            percentageOfMax: activity.percentageOfMax,
            time: activity.time,
            distance: activity.distance,
            distanceUnit: activity.distanceUnit,
            templateName: 'Unknown Activity',
            templateNotes: undefined,
            calculatedWeightKg: undefined,
          };
        }

        // Calculate weight if percentageOfMax is specified
        let calculatedWeightKg: number | undefined;
        let benchmarkWeightKg: number | undefined;
        let benchmarkName: string | undefined;
        let benchmarkTemplateId: string | undefined;

        if (activity.percentageOfMax !== undefined) {
          // Use benchmarkTemplateId from template if available, otherwise fallback to activityTemplateId
          benchmarkTemplateId = template.benchmarkTemplateId || activity.activityTemplateId;
          const benchmark = benchmarkMap.get(benchmarkTemplateId);

          if (benchmark) {
            // Get benchmark name from template map
            benchmarkName = benchmarkTemplateNameMap.get(benchmarkTemplateId);

            // Only calculate weight for WEIGHT type benchmarks
            if (benchmark.type === BenchmarkType.WEIGHT && benchmark.weightKg) {
              benchmarkWeightKg = benchmark.weightKg;
              const rawWeight = (benchmark.weightKg * activity.percentageOfMax) / 100;
              calculatedWeightKg = roundToHalf(rawWeight);
            }
          }
        }

        return {
          id: activity._id.toString(),
          activityTemplateId: activity.activityTemplateId,
          type: activity.type,
          order: activity.order,
          sets: activity.sets,
          reps: activity.reps,
          percentageOfMax: activity.percentageOfMax,
          time: activity.time,
          distance: activity.distance,
          distanceUnit: activity.distanceUnit,
          templateName: template.name,
          templateNotes: template.notes,
          calculatedWeightKg,
          // Benchmark debugging fields (optional, only present when percentageOfMax is defined)
          benchmarkWeightKg,
          benchmarkName,
          benchmarkTemplateId,
        };
      });

      return {
        id: day._id.toString(),
        name: day.name,
        order: day.order,
        activities: enrichedActivities,
      };
    });

    // 13. Build response
    res.status(200).json({
      success: true,
      data: {
        program: {
          id: program._id.toString(),
          name: program.name,
          description: program.description,
        },
        currentBlock: {
          id: currentBlock._id.toString(),
          name: currentBlock.name,
          order: currentBlock.order,
        },
        currentWeek: {
          id: currentWeek._id.toString(),
          name: currentWeek.name,
          order: currentWeek.order,
          days: enrichedDays,
        },
        progress: {
          blockIndex: program.currentProgress.blockIndex,
          weekIndex: program.currentProgress.weekIndex,
          totalWeeksCompleted: program.currentProgress.totalWeeksCompleted,
          startedAt: program.currentProgress.startedAt,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching current week workouts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch current week workouts',
    });
  }
};