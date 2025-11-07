import type { IBlock, IWeek, IDay, IActivity } from '@ironlogic4/shared/types/programs';
import type { ActivityTemplate } from '@ironlogic4/shared/types/activityTemplates';

/**
 * Calculate total volume (sets * reps) for activities in a given list
 * For lift activities with sets array, sums reps across all sets
 */
export function calculateVolume(activities: IActivity[]): number {
  return activities.reduce((total, activity) => {
    // For lift activities, use sets array
    if (activity.sets && Array.isArray(activity.sets)) {
      const setsVolume = activity.sets.reduce((sum, set) => sum + set.reps, 0);
      return total + setsVolume;
    }
    // For backward compatibility or non-lift activities
    return total;
  }, 0);
}

/**
 * Calculate volume for a specific activity group in a list of activities
 */
export function calculateGroupVolume(
  activities: IActivity[],
  activityGroupId: string,
  activityTemplates: ActivityTemplate[]
): number {
  // Filter activities that belong to this group
  const groupActivities = activities.filter(activity => {
    const template = activityTemplates.find(t => t.id === activity.activityTemplateId);
    return template?.groupId === activityGroupId;
  });

  return calculateVolume(groupActivities);
}

/**
 * Calculate volume for each activity group in a day
 */
export function calculateDayGroupVolumes(
  day: IDay,
  activityTemplates: ActivityTemplate[]
): Map<string, number> {
  const volumeMap = new Map<string, number>();

  day.activities.forEach(activity => {
    const template = activityTemplates.find(t => t.id === activity.activityTemplateId);
    if (template?.groupId) {
      const currentVolume = volumeMap.get(template.groupId) || 0;

      // Calculate volume based on sets array if present
      let activityVolume = 0;
      if (activity.sets && Array.isArray(activity.sets)) {
        activityVolume = activity.sets.reduce((sum, set) => sum + set.reps, 0);
      }

      volumeMap.set(template.groupId, currentVolume + activityVolume);
    }
  });

  return volumeMap;
}

/**
 * Calculate total volume for each activity group in a week
 */
export function calculateWeekGroupVolumes(
  week: IWeek,
  activityTemplates: ActivityTemplate[]
): Map<string, number> {
  const volumeMap = new Map<string, number>();

  week.days.forEach(day => {
    const dayVolumes = calculateDayGroupVolumes(day, activityTemplates);
    dayVolumes.forEach((volume, groupId) => {
      const currentVolume = volumeMap.get(groupId) || 0;
      volumeMap.set(groupId, currentVolume + volume);
    });
  });

  return volumeMap;
}

/**
 * Calculate total volume for each activity group in a block
 */
export function calculateBlockGroupVolumes(
  block: IBlock,
  activityTemplates: ActivityTemplate[]
): Map<string, number> {
  const volumeMap = new Map<string, number>();

  block.weeks.forEach(week => {
    const weekVolumes = calculateWeekGroupVolumes(week, activityTemplates);
    weekVolumes.forEach((volume, groupId) => {
      const currentVolume = volumeMap.get(groupId) || 0;
      volumeMap.set(groupId, currentVolume + volume);
    });
  });

  return volumeMap;
}

/**
 * Calculate volume percentage relative to target
 * Returns percentage (0-100+) and status (red/yellow/green)
 */
export interface VolumeStatus {
  percentage: number;
  status: 'red' | 'yellow' | 'green';
  actual: number;
  target: number;
}

export function calculateVolumeStatus(
  actualVolume: number,
  targetPercentage: number,
  totalVolume: number
): VolumeStatus {
  const targetVolume = (targetPercentage / 100) * totalVolume;
  const percentage = targetVolume > 0 ? (actualVolume / targetVolume) * 100 : 0;

  let status: 'red' | 'yellow' | 'green' = 'green';
  if (percentage < 90) {
    status = 'red';
  } else if (percentage < 100) {
    status = 'yellow';
  }

  return {
    percentage,
    status,
    actual: actualVolume,
    target: targetVolume,
  };
}

/**
 * Get volume status for week-level targets
 */
export function getWeekVolumeStatuses(
  week: IWeek,
  activityTemplates: ActivityTemplate[]
): Map<string, VolumeStatus> {
  const statusMap = new Map<string, VolumeStatus>();
  const actualVolumes = calculateWeekGroupVolumes(week, activityTemplates);

  // Calculate total volume for the week
  const totalVolume = Array.from(actualVolumes.values()).reduce((sum, vol) => sum + vol, 0);

  week.activityGroupTargets.forEach(target => {
    const actualVolume = actualVolumes.get(target.activityGroupId) || 0;
    const status = calculateVolumeStatus(actualVolume, target.targetPercentage, totalVolume);
    statusMap.set(target.activityGroupId, status);
  });

  return statusMap;
}

/**
 * Get volume status for block-level targets
 */
export function getBlockVolumeStatuses(
  block: IBlock,
  activityTemplates: ActivityTemplate[]
): Map<string, VolumeStatus> {
  const statusMap = new Map<string, VolumeStatus>();
  const actualVolumes = calculateBlockGroupVolumes(block, activityTemplates);

  // Calculate total volume for the block
  const totalVolume = Array.from(actualVolumes.values()).reduce((sum, vol) => sum + vol, 0);

  block.activityGroupTargets.forEach(target => {
    const actualVolume = actualVolumes.get(target.activityGroupId) || 0;
    const status = calculateVolumeStatus(actualVolume, target.targetPercentage, totalVolume);
    statusMap.set(target.activityGroupId, status);
  });

  return statusMap;
}