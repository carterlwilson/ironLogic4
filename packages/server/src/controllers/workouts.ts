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

    // 9. Collect all unique templateRepMax IDs from sets and templateSubMax IDs from cardio activities
    const templateRepMaxIds = new Set<string>();
    const templateSubMaxIds = new Set<string>();

    currentWeek.days.forEach(day => {
      day.activities.forEach(activity => {
        // Collect templateRepMaxIds from lift sets
        if (activity.sets) {
          activity.sets.forEach(set => {
            if (set.templateRepMaxId) {
              templateRepMaxIds.add(set.templateRepMaxId);
            }
          });
        }
        // Collect templateSubMaxIds from cardio activities
        if (activity.templateSubMaxId) {
          templateSubMaxIds.add(activity.templateSubMaxId);
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

    // Find all BenchmarkTemplates for DISTANCE and TIME that contain templateSubMaxIds or templateDistanceSubMaxIds
    const distanceAndTimeBenchmarkTemplates = await BenchmarkTemplate.find({
      $or: [
        { 'templateTimeSubMaxes._id': { $in: Array.from(templateSubMaxIds) } },
        { 'templateDistanceSubMaxes._id': { $in: Array.from(templateSubMaxIds) } }
      ]
    })
      .select('name templateTimeSubMaxes templateDistanceSubMaxes distanceUnit type')
      .lean();

    // Create map from templateSubMaxId to benchmark info for DISTANCE benchmarks
    const templateSubMaxToBenchmarkMap = new Map<string, {
      benchmarkTemplateId: string;
      benchmarkName: string;
      intervalName: string;
      distanceUnit: string;
      type: string;
    }>();

    distanceAndTimeBenchmarkTemplates
      .filter((t: any) => t.type === BenchmarkType.DISTANCE)
      .forEach((template: any) => {
        template.templateTimeSubMaxes?.forEach((tsm: any) => {
          templateSubMaxToBenchmarkMap.set(tsm._id.toString(), {
            benchmarkTemplateId: template._id.toString(),
            benchmarkName: template.name,
            intervalName: tsm.name,
            distanceUnit: template.distanceUnit,
            type: BenchmarkType.DISTANCE
          });
        });
      });

    // Create map from templateDistanceSubMaxId to benchmark info for TIME benchmarks
    const templateDistanceSubMaxToBenchmarkMap = new Map<string, {
      benchmarkTemplateId: string;
      benchmarkName: string;
      intervalName: string;
      distanceUnit: string;
      type: string;
    }>();

    distanceAndTimeBenchmarkTemplates
      .filter((t: any) => t.type === BenchmarkType.TIME)
      .forEach((template: any) => {
        template.templateDistanceSubMaxes?.forEach((dsm: any) => {
          templateDistanceSubMaxToBenchmarkMap.set(dsm._id.toString(), {
            benchmarkTemplateId: template._id.toString(),
            benchmarkName: template.name,
            intervalName: dsm.name,
            distanceUnit: template.distanceUnit,
            type: BenchmarkType.TIME
          });
        });
      });

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
            templateSubMaxId: activity.templateSubMaxId,
            percentageOfMax: activity.percentageOfMax,
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

        // Calculate distance/time for cardio activities with benchmark reference
        let calculatedDistanceMeters: number | null | undefined;
        let calculatedTimeSeconds: number | null | undefined;
        let benchmarkNameForCardio: string | null | undefined;
        let intervalName: string | null | undefined;
        let cardioDistanceUnit: string | undefined;
        let distanceInterval: string | undefined;
        let errorMessage: string | undefined;

        if (activity.templateSubMaxId && activity.percentageOfMax) {
          // Check if it's a DISTANCE or TIME benchmark
          const distanceInfo = templateSubMaxToBenchmarkMap.get(activity.templateSubMaxId);
          const timeInfo = templateDistanceSubMaxToBenchmarkMap.get(activity.templateSubMaxId);

          if (distanceInfo) {
            // DISTANCE benchmark logic (existing)
            const { benchmarkTemplateId, benchmarkName, intervalName: interval, distanceUnit } = distanceInfo;

            // Get client's benchmark for this template
            const clientBenchmark = benchmarkMap.get(benchmarkTemplateId);

            if (clientBenchmark?.type === BenchmarkType.DISTANCE && clientBenchmark.timeSubMaxes) {
              // Find the specific TimeSubMax that matches this templateSubMaxId
              const timeSubMax = clientBenchmark.timeSubMaxes.find(
                (tsm: any) => tsm.templateSubMaxId === activity.templateSubMaxId
              );

              if (timeSubMax?.distanceMeters) {
                calculatedDistanceMeters = (timeSubMax.distanceMeters * activity.percentageOfMax) / 100;
              } else {
                calculatedDistanceMeters = null;
                errorMessage = 'Client has not recorded this specific interval';
              }

              benchmarkNameForCardio = `${benchmarkName} - ${interval}`;
              intervalName = interval;
              cardioDistanceUnit = distanceUnit;
            } else {
              calculatedDistanceMeters = null;
              benchmarkNameForCardio = `${benchmarkName} - ${interval}`;
              intervalName = interval;
              cardioDistanceUnit = distanceUnit;
              errorMessage = 'Client has not recorded this benchmark yet';
            }
          } else if (timeInfo) {
            // TIME benchmark logic (NEW)
            const { benchmarkTemplateId, benchmarkName, intervalName: interval, distanceUnit } = timeInfo;

            // Get client's benchmark for this template
            const clientBenchmark = benchmarkMap.get(benchmarkTemplateId);

            if (clientBenchmark?.type === BenchmarkType.TIME && clientBenchmark.distanceSubMaxes) {
              // Find the specific DistanceSubMax that matches this templateSubMaxId
              const distanceSubMax = clientBenchmark.distanceSubMaxes.find(
                (dsm: any) => dsm.templateDistanceSubMaxId === activity.templateSubMaxId
              );

              if (distanceSubMax?.timeSeconds) {
                calculatedTimeSeconds = (distanceSubMax.timeSeconds * activity.percentageOfMax) / 100;
              } else {
                calculatedTimeSeconds = null;
                errorMessage = 'Client has not recorded this specific distance';
              }

              benchmarkNameForCardio = `${benchmarkName} - ${interval}`;
              intervalName = interval;
              distanceInterval = interval;
            } else {
              calculatedTimeSeconds = null;
              benchmarkNameForCardio = `${benchmarkName} - ${interval}`;
              intervalName = interval;
              distanceInterval = interval;
              errorMessage = 'Client has not recorded this benchmark yet';
            }
          } else {
            calculatedDistanceMeters = null;
            errorMessage = 'Benchmark template not found';
          }
        }

        return {
          id: activity._id.toString(),
          activityTemplateId: activity.activityTemplateId,
          type: activity.type,
          order: activity.order,
          sets: activity.sets,
          cardioType: activity.cardioType,
          time: activity.time,
          distance: activity.distance,
          distanceUnit: activity.distanceUnit,
          repetitions: activity.repetitions,
          templateSubMaxId: activity.templateSubMaxId,
          percentageOfMax: activity.percentageOfMax,
          templateName: template.name,
          templateNotes: template.notes,
          setCalculations,
          // Cardio benchmark fields
          calculatedDistanceMeters,
          calculatedTimeSeconds,
          benchmarkName: benchmarkNameForCardio,
          intervalName,
          distanceInterval,
          cardioDistanceUnit,
          error: errorMessage,
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