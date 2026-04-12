import { useState, useEffect, useCallback } from 'react';
import { ActivityType } from '@ironlogic4/shared';
import type { SetProgress, ActivityProgress } from '../pages/WorkoutPage';

const STORAGE_PREFIX = 'workout:';
const TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days in ms

interface PersistedDayProgress {
  progress: Record<string, ActivityProgress>;
  savedAt: number;
}

interface WorkoutActivityRef {
  id: string;
  type: string;
  setCalculations?: { setNumber: number }[];
}

function purgeStaleEntries(): void {
  const keysToDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed: PersistedDayProgress = JSON.parse(raw);
          if (Date.now() - parsed.savedAt > TTL_MS) {
            keysToDelete.push(key);
          }
        }
      } catch {
        keysToDelete.push(key!);
      }
    }
  }
  keysToDelete.forEach(key => localStorage.removeItem(key));
}

function loadDayProgress(weekId: string, dayId: string): Map<string, ActivityProgress> {
  const key = `${STORAGE_PREFIX}${weekId}:${dayId}`;
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed: PersistedDayProgress = JSON.parse(raw);
      return new Map(Object.entries(parsed.progress));
    }
  } catch {
    // ignore parse errors
  }
  return new Map();
}

function persistDayProgress(weekId: string, dayId: string, progress: Map<string, ActivityProgress>): void {
  const key = `${STORAGE_PREFIX}${weekId}:${dayId}`;
  const value: PersistedDayProgress = {
    progress: Object.fromEntries(progress),
    savedAt: Date.now(),
  };
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore quota errors
  }
}

export function useWorkoutProgress(
  weekId: string | undefined,
  dayId: string | undefined,
  activities: WorkoutActivityRef[]
) {
  const [progress, setProgress] = useState<Map<string, ActivityProgress>>(new Map());

  useEffect(() => {
    if (!weekId || !dayId) {
      setProgress(new Map());
      return;
    }
    purgeStaleEntries();
    setProgress(loadDayProgress(weekId, dayId));
  }, [weekId, dayId]);

  const handleSetComplete = useCallback((activityId: string, setIndex: number) => {
    if (!weekId || !dayId) return;

    setProgress(prev => {
      const newMap = new Map(prev);
      const activity = activities.find(a => a.id === activityId);
      const setsCount = activity?.setCalculations?.length ?? 0;

      const existing = newMap.get(activityId) ?? {
        sets: Array(setsCount).fill({ completed: false }) as SetProgress[],
        completed: false,
      };

      const newSets = [...existing.sets];
      while (newSets.length <= setIndex) {
        newSets.push({ completed: false });
      }
      newSets[setIndex] = { completed: !newSets[setIndex].completed };

      const updated: ActivityProgress = { ...existing, sets: newSets };
      newMap.set(activityId, updated);
      persistDayProgress(weekId, dayId, newMap);
      return newMap;
    });
  }, [weekId, dayId, activities]);

  const handleActivityComplete = useCallback((activityId: string) => {
    if (!weekId || !dayId) return;

    setProgress(prev => {
      const newMap = new Map(prev);
      const activity = activities.find(a => a.id === activityId);
      if (!activity) return newMap;

      const setsCount = activity.type === ActivityType.LIFT
        ? (activity.setCalculations?.length ?? 0)
        : 0;

      const existing = newMap.get(activityId) ?? {
        sets: Array(setsCount).fill({ completed: false }) as SetProgress[],
        completed: false,
      };

      const updated: ActivityProgress = { ...existing, completed: !existing.completed };
      newMap.set(activityId, updated);
      persistDayProgress(weekId, dayId, newMap);
      return newMap;
    });
  }, [weekId, dayId, activities]);

  const getActivityProgress = useCallback((activityId: string): ActivityProgress => {
    const activity = activities.find(a => a.id === activityId);
    const setsCount = activity?.type === ActivityType.LIFT
      ? (activity.setCalculations?.length ?? 0)
      : 0;

    return progress.get(activityId) ?? {
      sets: Array(setsCount).fill({ completed: false }) as SetProgress[],
      completed: false,
    };
  }, [progress, activities]);

  return { getActivityProgress, handleSetComplete, handleActivityComplete };
}
