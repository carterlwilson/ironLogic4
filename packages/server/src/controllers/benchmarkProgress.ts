import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { BenchmarkTemplate } from '../models/BenchmarkTemplate.js';
import { BenchmarkType } from '@ironlogic4/shared';

/**
 * Helper: Format date for chart display
 * @param date Date to format
 * @param includeYear Whether to include year in format
 * @returns Formatted date string (e.g., "Jan 15" or "Jan 15, 2025")
 */
function formatDate(date: Date, includeYear: boolean): string {
  const month = date.toLocaleDateString('en-US', { month: 'short' });
  const day = date.getDate();

  if (includeYear) {
    const year = date.getFullYear();
    return `${month} ${day}, ${year}`;
  }

  return `${month} ${day}`;
}

/**
 * Helper: Get base unit label for benchmark type
 */
function getUnitLabel(template: any): string {
  switch (template.type) {
    case BenchmarkType.WEIGHT:
      return 'kg';
    case BenchmarkType.DISTANCE:
      return template.distanceUnit === 'kilometers' ? 'km' : 'm';
    case BenchmarkType.TIME:
      return 's';
    case BenchmarkType.REPS:
      return 'reps';
    case BenchmarkType.OTHER:
      return 'value';
    default:
      return '';
  }
}

/**
 * Helper: Check if two dates are on the same day
 */
function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Helper: Extract all data points from benchmarks for multi-series chart
 */
interface DataPoint {
  date: Date;
  value: number;
  submaxKey: string;
  submaxLabel: string;
}

function extractAllDataPoints(
  benchmarks: any[],
  template: any
): DataPoint[] {
  const dataPoints: DataPoint[] = [];

  for (const benchmark of benchmarks) {
    if (benchmark.type === BenchmarkType.WEIGHT && benchmark.repMaxes) {
      // Extract all rep maxes
      for (const repMax of benchmark.repMaxes) {
        if (!repMax.recordedAt || repMax.weightKg === null || repMax.weightKg === undefined) continue;

        // Find template rep max for label
        const templateRepMax = template.templateRepMaxes?.find(
          (trm: any) => trm.id === repMax.templateRepMaxId || trm._id?.toString() === repMax.templateRepMaxId
        );
        const label = templateRepMax?.name || `${templateRepMax?.reps}RM` || 'Rep Max';
        const key = `repmax_${repMax.templateRepMaxId}`;

        dataPoints.push({
          date: new Date(repMax.recordedAt),
          value: repMax.weightKg,
          submaxKey: key,
          submaxLabel: label,
        });
      }
    } else if (benchmark.type === BenchmarkType.DISTANCE && benchmark.timeSubMaxes) {
      // Extract all distance sub-maxes
      for (const tsm of benchmark.timeSubMaxes) {
        if (!tsm.recordedAt || tsm.distanceMeters === null || tsm.distanceMeters === undefined) continue;

        // Find template time sub-max for label
        const templateSubMax = template.templateTimeSubMaxes?.find(
          (t: any) => t.id === tsm.templateSubMaxId || t._id?.toString() === tsm.templateSubMaxId
        );
        const label = templateSubMax?.name || 'Distance';
        const key = `timesubmax_${tsm.templateSubMaxId}`;

        let value = tsm.distanceMeters;
        // Convert to kilometers if needed
        if (template.distanceUnit === 'kilometers') {
          value = value / 1000;
        }

        dataPoints.push({
          date: new Date(tsm.recordedAt),
          value,
          submaxKey: key,
          submaxLabel: label,
        });
      }
    } else if (benchmark.type === BenchmarkType.TIME && benchmark.distanceSubMaxes) {
      // Extract all time sub-maxes (for TIME type with distanceSubMaxes structure)
      for (const dsm of benchmark.distanceSubMaxes) {
        if (!dsm.recordedAt || dsm.timeSeconds === null || dsm.timeSeconds === undefined) continue;

        // Find template distance sub-max for label
        const templateSubMax = template.templateDistanceSubMaxes?.find(
          (t: any) => t.id === dsm.templateDistanceSubMaxId || t._id?.toString() === dsm.templateDistanceSubMaxId
        );
        const label = templateSubMax?.name || 'Time';
        const key = `distsubmax_${dsm.templateDistanceSubMaxId}`;

        dataPoints.push({
          date: new Date(dsm.recordedAt),
          value: dsm.timeSeconds,
          submaxKey: key,
          submaxLabel: label,
        });
      }
    } else if (benchmark.type === BenchmarkType.TIME && benchmark.timeSeconds !== null && benchmark.timeSeconds !== undefined) {
      // Old-style TIME benchmark with single timeSeconds value
      if (benchmark.recordedAt) {
        dataPoints.push({
          date: new Date(benchmark.recordedAt),
          value: benchmark.timeSeconds,
          submaxKey: 'value',
          submaxLabel: 'Time',
        });
      }
    } else if (benchmark.type === BenchmarkType.REPS && benchmark.reps !== null && benchmark.reps !== undefined) {
      if (benchmark.recordedAt) {
        dataPoints.push({
          date: new Date(benchmark.recordedAt),
          value: benchmark.reps,
          submaxKey: 'value',
          submaxLabel: 'Reps',
        });
      }
    } else if (benchmark.type === BenchmarkType.OTHER && benchmark.otherNotes) {
      const parsed = parseFloat(benchmark.otherNotes);
      if (!isNaN(parsed) && benchmark.recordedAt) {
        dataPoints.push({
          date: new Date(benchmark.recordedAt),
          value: parsed,
          submaxKey: 'value',
          submaxLabel: 'Value',
        });
      }
    }
  }

  return dataPoints;
}

/**
 * Helper: Build multi-series chart data from data points
 */
function buildChartData(dataPoints: DataPoint[], includeYear: boolean) {
  // Group by submax key
  const submaxGroups = new Map<string, Array<{ date: Date; value: number; label: string }>>();

  for (const point of dataPoints) {
    if (!submaxGroups.has(point.submaxKey)) {
      submaxGroups.set(point.submaxKey, []);
    }
    submaxGroups.get(point.submaxKey)!.push({
      date: point.date,
      value: point.value,
      label: point.submaxLabel,
    });
  }

  // Get all unique dates
  const allDates = Array.from(new Set(dataPoints.map((p) => p.date.getTime())))
    .map((time) => new Date(time))
    .sort((a, b) => a.getTime() - b.getTime());

  // Build chart data with one row per date
  const chartData = allDates.map((date) => {
    const row: Record<string, any> = {
      date: formatDate(date, includeYear),
    };

    // For each submax series, find the value for this date
    for (const [key, values] of submaxGroups.entries()) {
      const dataPoint = values.find((v) => isSameDay(v.date, date));
      row[key] = dataPoint?.value ?? null;
    }

    return row;
  });

  // Build series metadata
  const series: Array<{ name: string; label: string }> = [];
  for (const [key, values] of submaxGroups.entries()) {
    // Get label from first data point in this series
    const label = values[0]?.label || key;
    series.push({
      name: key,
      label,
    });
  }

  return { chartData, series };
}

/**
 * GET /api/me/benchmarks/:templateId/progress
 * Get benchmark progress data for charts
 *
 * Query Parameters:
 * - limit: Maximum number of data points to return (optional)
 * - startDate: ISO date string for filtering (optional)
 * - endDate: ISO date string for filtering (optional)
 */
export const getBenchmarkProgress = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { templateId } = req.params;
    const { limit, startDate, endDate } = req.query;

    // Fetch user with benchmarks
    const user = await User.findById(userId).select('currentBenchmarks historicalBenchmarks');
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User not found'
      });
      return;
    }

    // Fetch benchmark template
    const template = await BenchmarkTemplate.findById(templateId);
    if (!template) {
      res.status(404).json({
        success: false,
        error: 'Benchmark template not found'
      });
      return;
    }

    // Combine current and historical benchmarks
    const allBenchmarks = [
      ...(user.currentBenchmarks || []),
      ...(user.historicalBenchmarks || [])
    ];

    // Filter benchmarks for this template
    const benchmarksForTemplate = allBenchmarks.filter(
      b => b.templateId === templateId
    );

    // Extract all data points from benchmarks
    let dataPoints = extractAllDataPoints(benchmarksForTemplate, template);

    // Apply date filters if provided
    if (startDate) {
      const start = new Date(startDate as string);
      dataPoints = dataPoints.filter((p) => p.date >= start);
    }

    if (endDate) {
      const end = new Date(endDate as string);
      dataPoints = dataPoints.filter((p) => p.date <= end);
    }

    // Sort data points by date
    dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime());

    // Apply limit if provided (take most recent N data points)
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        dataPoints = dataPoints.slice(-limitNum);
      }
    }

    // Check if we have data
    if (dataPoints.length === 0) {
      res.json({
        success: true,
        data: {
          benchmarkName: template.name,
          benchmarkType: template.type,
          unit: getUnitLabel(template),
          chartData: [],
          series: []
        }
      });
      return;
    }

    // Determine if we need to include year in dates
    const dates = dataPoints.map((p) => p.date);
    const years = new Set(dates.map((d) => d.getFullYear()));
    const includeYear = years.size > 1;

    // Build chart data
    const { chartData, series } = buildChartData(dataPoints, includeYear);

    res.json({
      success: true,
      data: {
        benchmarkName: template.name,
        benchmarkType: template.type,
        unit: getUnitLabel(template),
        chartData,
        series
      }
    });

  } catch (error) {
    console.error('Error fetching benchmark progress:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch benchmark progress'
    });
  }
};
