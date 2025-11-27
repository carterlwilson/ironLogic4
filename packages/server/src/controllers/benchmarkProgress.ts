import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth.js';
import { User } from '../models/User.js';
import { BenchmarkTemplate } from '../models/BenchmarkTemplate.js';
import { BenchmarkType } from '@ironlogic4/shared';

/**
 * Helper: Extract numeric value from benchmark based on type
 */
function extractValue(benchmark: any): number | null {
  switch (benchmark.type) {
    case BenchmarkType.WEIGHT:
      return benchmark.weightKg ?? null;
    case BenchmarkType.TIME:
      return benchmark.timeSeconds ?? null;
    case BenchmarkType.REPS:
      return benchmark.reps ?? null;
    case BenchmarkType.OTHER:
      // Try to parse as number, return null if can't
      const parsed = parseFloat(benchmark.otherNotes);
      return isNaN(parsed) ? null : parsed;
    default:
      return null;
  }
}

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
 * Helper: Get unit label for benchmark type
 */
function getUnitLabel(benchmarkType: BenchmarkType): string {
  switch (benchmarkType) {
    case BenchmarkType.WEIGHT:
      return 'kg';
    case BenchmarkType.TIME:
      return 'seconds';
    case BenchmarkType.REPS:
      return 'reps';
    case BenchmarkType.OTHER:
      return 'value';
    default:
      return '';
  }
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
    let benchmarksForTemplate = allBenchmarks.filter(
      b => b.templateId === templateId
    );

    // Apply date filters if provided
    if (startDate) {
      const start = new Date(startDate as string);
      benchmarksForTemplate = benchmarksForTemplate.filter(
        b => b.recordedAt && new Date(b.recordedAt) >= start
      );
    }

    if (endDate) {
      const end = new Date(endDate as string);
      benchmarksForTemplate = benchmarksForTemplate.filter(
        b => b.recordedAt && new Date(b.recordedAt) <= end
      );
    }

    // Sort by recordedAt (oldest to newest)
    benchmarksForTemplate.sort((a, b) => {
      if (!a.recordedAt || !b.recordedAt) return 0;
      return new Date(a.recordedAt).getTime() - new Date(b.recordedAt).getTime();
    });

    // Apply limit if provided
    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (!isNaN(limitNum) && limitNum > 0) {
        // Take the most recent N points
        benchmarksForTemplate = benchmarksForTemplate.slice(-limitNum);
      }
    }

    // Check if we have data
    if (benchmarksForTemplate.length === 0) {
      res.json({
        success: true,
        data: {
          benchmarkName: template.name,
          benchmarkType: template.type,
          unit: getUnitLabel(template.type),
          chartData: []
        }
      });
      return;
    }

    // Determine if we need to include year in dates
    const dates = benchmarksForTemplate
      .filter(b => b.recordedAt)
      .map(b => new Date(b.recordedAt!));
    const years = new Set(dates.map(d => d.getFullYear()));
    const includeYear = years.size > 1;

    // Build chart data
    const chartData = benchmarksForTemplate
      .map(benchmark => {
        const value = extractValue(benchmark);
        if (value === null || !benchmark.recordedAt) return null;

        return {
          date: formatDate(new Date(benchmark.recordedAt), includeYear),
          value
        };
      })
      .filter((item): item is { date: string; value: number } => item !== null);

    res.json({
      success: true,
      data: {
        benchmarkName: template.name,
        benchmarkType: template.type,
        unit: getUnitLabel(template.type),
        chartData
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