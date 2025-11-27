import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { Program } from '../models/Program.js';
import { ActivityTemplate } from '../models/ActivityTemplate.js';
import { BenchmarkTemplate } from '../models/BenchmarkTemplate.js';
import { BenchmarkType } from '@ironlogic4/shared';

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
      .select('name notes type')
      .lean();

    // Create a map for quick lookup
    const templateMap = new Map(
      activityTemplates.map(template => [template._id.toString(), template])
    );

    // 9. Collect all unique templateRepMax IDs from sets
    const templateRepMaxIds = new Set<string>();

    currentWeek.days.forEach(day => {
      day.activities.forEach(activity => {
        if (activity.sets) {
          activity.sets.forEach(set => {
            if (set.templateRepMaxId) {
              templateRepMaxIds.add(set.templateRepMaxId);
            }
          });
        }
      });
    });

    // 10. Find all BenchmarkTemplates that contain these templateRepMaxIds
    const benchmarkTemplates = await BenchmarkTemplate.find({
      'templateRepMaxes._id': { $in: Array.from(templateRepMaxIds) }
    })
      .select('name templateRepMaxes')
      .lean();

    // Create map from templateRepMaxId to benchmark info
    const templateRepMaxToBenchmarkMap = new Map<string, {
      benchmarkTemplateId: string;
      benchmarkName: string;
      repMaxReps: number;
      repMaxName: string;
    }>();

    benchmarkTemplates.forEach((template: any) => {
      template.templateRepMaxes?.forEach((trm: any) => {
        templateRepMaxToBenchmarkMap.set(trm._id.toString(), {
          benchmarkTemplateId: template._id.toString(),
          benchmarkName: template.name,
          repMaxReps: trm.reps,
          repMaxName: trm.name
        });
      });
    });

    // Get unique benchmark template IDs for user benchmarks lookup
    const benchmarkTemplateIds = new Set(
      Array.from(templateRepMaxToBenchmarkMap.values()).map(v => v.benchmarkTemplateId)
    );

    // 11. Create benchmark lookup map (by templateId)
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
            time: activity.time,
            distance: activity.distance,
            distanceUnit: activity.distanceUnit,
            templateName: 'Unknown Activity',
            templateNotes: undefined,
          };
        }

        // Calculate weight for each set if sets array exists (lift activities)
        let setCalculations: Array<{
          setNumber: number;
          reps: number;
          percentageOfMax: number;
          calculatedWeightKg?: number;
          templateRepMaxId?: string;
          benchmarkName?: string;
          repMaxReps?: number;
        }> | undefined;

        if (activity.sets && activity.sets.length > 0) {
          // Calculate weight for each set
          setCalculations = activity.sets.map((set, index) => {
            let calculatedWeightKg: number | undefined;
            let benchmarkName: string | undefined;
            let repMaxReps: number | undefined;

            if (set.templateRepMaxId) {
              // Get template info for this templateRepMaxId
              const templateInfo = templateRepMaxToBenchmarkMap.get(set.templateRepMaxId);

              if (templateInfo) {
                const { benchmarkTemplateId, benchmarkName: baseName, repMaxReps: reps, repMaxName } = templateInfo;

                // Get client's benchmark for this template
                const clientBenchmark = benchmarkMap.get(benchmarkTemplateId);

                if (clientBenchmark?.type === BenchmarkType.WEIGHT && clientBenchmark.repMaxes) {
                  // Find the specific RepMax that matches this templateRepMaxId
                  const repMax = clientBenchmark.repMaxes.find((rm: any) => rm.templateRepMaxId === set.templateRepMaxId);

                  if (repMax?.weightKg) {
                    const rawWeight = (repMax.weightKg * set.percentageOfMax) / 100;
                    calculatedWeightKg = Math.round(rawWeight);
                  }

                  // Build full benchmark name: "Back Squat - 3RM"
                  benchmarkName = `${baseName} - ${repMaxName}`;
                  repMaxReps = reps;
                }
              }
            }

            return {
              setNumber: index + 1, // 1-based index for display
              reps: set.reps,
              percentageOfMax: set.percentageOfMax,
              calculatedWeightKg,
              templateRepMaxId: set.templateRepMaxId,
              benchmarkName,
              repMaxReps,
            };
          });
        }

        return {
          id: activity._id.toString(),
          activityTemplateId: activity.activityTemplateId,
          type: activity.type,
          order: activity.order,
          sets: activity.sets,
          time: activity.time,
          distance: activity.distance,
          distanceUnit: activity.distanceUnit,
          templateName: template.name,
          templateNotes: template.notes,
          setCalculations,
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