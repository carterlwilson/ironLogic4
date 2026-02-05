import { produce } from 'immer';
import type { IProgram, IBlock, IWeek, IDay, IActivity } from '@ironlogic4/shared/types/programs';

/**
 * Generate a unique temporary ID
 */
export function generateTempId(): string {
  return `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Find block by ID
 */
export function findBlock(program: IProgram, blockId: string): IBlock | undefined {
  return program.blocks.find(b => b.id === blockId);
}

/**
 * Find week by ID
 */
export function findWeek(program: IProgram, weekId: string): { block: IBlock; week: IWeek } | undefined {
  for (const block of program.blocks) {
    const week = block.weeks.find(w => w.id === weekId);
    if (week) {
      return { block, week };
    }
  }
  return undefined;
}

/**
 * Find day by ID
 */
export function findDay(program: IProgram, dayId: string): { block: IBlock; week: IWeek; day: IDay } | undefined {
  for (const block of program.blocks) {
    for (const week of block.weeks) {
      const day = week.days.find(d => d.id === dayId);
      if (day) {
        return { block, week, day };
      }
    }
  }
  return undefined;
}

/**
 * Find activity by ID
 */
export function findActivity(program: IProgram, activityId: string): { block: IBlock; week: IWeek; day: IDay; activity: IActivity } | undefined {
  for (const block of program.blocks) {
    for (const week of block.weeks) {
      for (const day of week.days) {
        const activity = day.activities.find(a => a.id === activityId);
        if (activity) {
          return { block, week, day, activity };
        }
      }
    }
  }
  return undefined;
}

/**
 * Update block in program
 */
export function updateBlock(program: IProgram, blockId: string, updater: (block: IBlock) => void): IProgram {
  return produce(program, draft => {
    const block = draft.blocks.find(b => b.id === blockId);
    if (block) {
      updater(block);
    }
  });
}

/**
 * Update week in program
 */
export function updateWeek(program: IProgram, weekId: string, updater: (week: IWeek) => void): IProgram {
  return produce(program, draft => {
    for (const block of draft.blocks) {
      const week = block.weeks.find(w => w.id === weekId);
      if (week) {
        updater(week);
        return;
      }
    }
  });
}

/**
 * Update day in program
 */
export function updateDay(program: IProgram, dayId: string, updater: (day: IDay) => void): IProgram {
  return produce(program, draft => {
    for (const block of draft.blocks) {
      for (const week of block.weeks) {
        const day = week.days.find(d => d.id === dayId);
        if (day) {
          updater(day);
          return;
        }
      }
    }
  });
}

/**
 * Update activity in program
 */
export function updateActivity(program: IProgram, activityId: string, updater: (activity: IActivity) => void): IProgram {
  return produce(program, draft => {
    for (const block of draft.blocks) {
      for (const week of block.weeks) {
        for (const day of week.days) {
          const activity = day.activities.find(a => a.id === activityId);
          if (activity) {
            updater(activity);
            return;
          }
        }
      }
    }
  });
}

/**
 * Add block to program
 */
export function addBlock(program: IProgram, block: Omit<IBlock, 'id' | 'order'>): IProgram {
  return produce(program, draft => {
    const newBlock: IBlock = {
      ...block,
      id: generateTempId(),
      order: draft.blocks.length,
    };
    draft.blocks.push(newBlock);
  });
}

/**
 * Delete block from program
 */
export function deleteBlock(program: IProgram, blockId: string): IProgram {
  return produce(program, draft => {
    const index = draft.blocks.findIndex(b => b.id === blockId);
    if (index !== -1) {
      draft.blocks.splice(index, 1);
      // Reorder remaining blocks
      draft.blocks.forEach((block, i) => {
        block.order = i;
      });
    }
  });
}

/**
 * Add week to block
 */
export function addWeek(program: IProgram, blockId: string, week: Omit<IWeek, 'id' | 'order'>): IProgram {
  return produce(program, draft => {
    const block = draft.blocks.find(b => b.id === blockId);
    if (block) {
      const newWeek: IWeek = {
        ...week,
        id: generateTempId(),
        order: block.weeks.length,
      };
      block.weeks.push(newWeek);
    }
  });
}

/**
 * Delete week from block
 */
export function deleteWeek(program: IProgram, weekId: string): IProgram {
  return produce(program, draft => {
    for (const block of draft.blocks) {
      const index = block.weeks.findIndex(w => w.id === weekId);
      if (index !== -1) {
        block.weeks.splice(index, 1);
        // Reorder remaining weeks
        block.weeks.forEach((week, i) => {
          week.order = i;
        });
        return;
      }
    }
  });
}

/**
 * Add day to week
 */
export function addDay(program: IProgram, weekId: string, day: Omit<IDay, 'id' | 'order'>): IProgram {
  return produce(program, draft => {
    for (const block of draft.blocks) {
      const week = block.weeks.find(w => w.id === weekId);
      if (week) {
        const newDay: IDay = {
          ...day,
          id: generateTempId(),
          order: week.days.length,
        };
        week.days.push(newDay);
        return;
      }
    }
  });
}

/**
 * Delete day from week
 */
export function deleteDay(program: IProgram, dayId: string): IProgram {
  return produce(program, draft => {
    for (const block of draft.blocks) {
      for (const week of block.weeks) {
        const index = week.days.findIndex(d => d.id === dayId);
        if (index !== -1) {
          week.days.splice(index, 1);
          // Reorder remaining days
          week.days.forEach((day, i) => {
            day.order = i;
          });
          return;
        }
      }
    }
  });
}

/**
 * Add activity to day
 */
export function addActivity(program: IProgram, dayId: string, activity: Omit<IActivity, 'id' | 'order'>): IProgram {
  return produce(program, draft => {
    for (const block of draft.blocks) {
      for (const week of block.weeks) {
        const day = week.days.find(d => d.id === dayId);
        if (day) {
          const newActivity: IActivity = {
            ...activity,
            id: generateTempId(),
            order: day.activities.length,
          };
          day.activities.push(newActivity);
          return;
        }
      }
    }
  });
}

/**
 * Delete activity from day
 */
export function deleteActivity(program: IProgram, activityId: string): IProgram {
  return produce(program, draft => {
    for (const block of draft.blocks) {
      for (const week of block.weeks) {
        for (const day of week.days) {
          const index = day.activities.findIndex(a => a.id === activityId);
          if (index !== -1) {
            day.activities.splice(index, 1);
            // Reorder remaining activities
            day.activities.forEach((activity, i) => {
              activity.order = i;
            });
            return;
          }
        }
      }
    }
  });
}

/**
 * Reorder activities in a day
 */
export function reorderActivities(program: IProgram, dayId: string, reorderedActivities: IActivity[]): IProgram {
  return produce(program, draft => {
    for (const block of draft.blocks) {
      for (const week of block.weeks) {
        const day = week.days.find(d => d.id === dayId);
        if (day) {
          // Use the reordered IDs to sort the draft's activities
          // This keeps us working within the draft, avoiding immer adding fields
          const idOrder = reorderedActivities.map(a => a.id);
          day.activities.sort((a, b) => {
            return idOrder.indexOf(a.id) - idOrder.indexOf(b.id);
          });
          return;
        }
      }
    }
  });
}

/**
 * Recursively generate new IDs for an activity and return a new object
 */
function regenerateActivityIds(activity: IActivity): IActivity {
  return {
    ...activity,
    id: generateTempId(),
  };
}

/**
 * Recursively generate new IDs for a day and all its activities
 */
function regenerateDayIds(day: IDay): IDay {
  return {
    ...day,
    id: generateTempId(),
    activities: day.activities.map(regenerateActivityIds),
  };
}

/**
 * Recursively generate new IDs for a week and all its nested content
 */
function regenerateWeekIds(week: IWeek): IWeek {
  return {
    ...week,
    id: generateTempId(),
    days: week.days.map(regenerateDayIds),
  };
}

/**
 * Recursively generate new IDs for a block and all its nested content
 */
function regenerateBlockIds(block: IBlock): IBlock {
  return {
    ...block,
    id: generateTempId(),
    weeks: block.weeks.map(regenerateWeekIds),
  };
}

/**
 * Copy a block and insert it immediately after the source block
 */
export function copyBlock(program: IProgram, blockId: string): IProgram {
  // Find and clone the source block BEFORE entering produce
  const sourceIndex = program.blocks.findIndex(b => b.id === blockId);
  if (sourceIndex === -1) return program;

  const sourceBlock = program.blocks[sourceIndex];
  const clonedBlock = JSON.parse(JSON.stringify(sourceBlock));
  const copiedBlock = regenerateBlockIds(clonedBlock);
  copiedBlock.order = sourceIndex + 1;
  copiedBlock.name = `${sourceBlock.name} (Copy)`;

  return produce(program, draft => {
    // Insert after source
    draft.blocks.splice(sourceIndex + 1, 0, copiedBlock);

    // Reorder all subsequent blocks
    for (let i = sourceIndex + 2; i < draft.blocks.length; i++) {
      draft.blocks[i].order = i;
    }
  });
}

/**
 * Copy a week and insert it immediately after the source week
 */
export function copyWeek(program: IProgram, weekId: string): IProgram {
  // Find and clone the source week BEFORE entering produce
  let sourceWeek: IWeek | undefined;
  let blockIndex = -1;
  let sourceIndex = -1;

  for (let i = 0; i < program.blocks.length; i++) {
    const idx = program.blocks[i].weeks.findIndex(w => w.id === weekId);
    if (idx !== -1) {
      sourceWeek = program.blocks[i].weeks[idx];
      blockIndex = i;
      sourceIndex = idx;
      break;
    }
  }

  if (!sourceWeek || blockIndex === -1 || sourceIndex === -1) return program;

  const clonedWeek = JSON.parse(JSON.stringify(sourceWeek));
  const copiedWeek = regenerateWeekIds(clonedWeek);
  copiedWeek.order = sourceIndex + 1;

  return produce(program, draft => {
    // Insert after source
    draft.blocks[blockIndex].weeks.splice(sourceIndex + 1, 0, copiedWeek);

    // Reorder all subsequent weeks
    for (let i = sourceIndex + 2; i < draft.blocks[blockIndex].weeks.length; i++) {
      draft.blocks[blockIndex].weeks[i].order = i;
    }
  });
}

/**
 * Copy a day and insert it immediately after the source day
 */
export function copyDay(program: IProgram, dayId: string): IProgram {
  // Find and clone the source day BEFORE entering produce
  let sourceDay: IDay | undefined;
  let blockIndex = -1;
  let weekIndex = -1;
  let sourceIndex = -1;

  for (let i = 0; i < program.blocks.length; i++) {
    for (let j = 0; j < program.blocks[i].weeks.length; j++) {
      const idx = program.blocks[i].weeks[j].days.findIndex(d => d.id === dayId);
      if (idx !== -1) {
        sourceDay = program.blocks[i].weeks[j].days[idx];
        blockIndex = i;
        weekIndex = j;
        sourceIndex = idx;
        break;
      }
    }
    if (sourceDay) break;
  }

  if (!sourceDay || blockIndex === -1 || weekIndex === -1 || sourceIndex === -1) return program;

  const clonedDay = JSON.parse(JSON.stringify(sourceDay));
  const copiedDay = regenerateDayIds(clonedDay);
  copiedDay.order = sourceIndex + 1;

  return produce(program, draft => {
    // Insert after source
    draft.blocks[blockIndex].weeks[weekIndex].days.splice(sourceIndex + 1, 0, copiedDay);

    // Reorder all subsequent days
    for (let i = sourceIndex + 2; i < draft.blocks[blockIndex].weeks[weekIndex].days.length; i++) {
      draft.blocks[blockIndex].weeks[weekIndex].days[i].order = i;
    }
  });
}

/**
 * Copy an activity and insert it immediately after the source activity
 */
export function copyActivity(program: IProgram, activityId: string): IProgram {
  // Find and clone the source activity BEFORE entering produce
  let sourceActivity: IActivity | undefined;
  let blockIndex = -1;
  let weekIndex = -1;
  let dayIndex = -1;
  let sourceIndex = -1;

  for (let i = 0; i < program.blocks.length; i++) {
    for (let j = 0; j < program.blocks[i].weeks.length; j++) {
      for (let k = 0; k < program.blocks[i].weeks[j].days.length; k++) {
        const idx = program.blocks[i].weeks[j].days[k].activities.findIndex(a => a.id === activityId);
        if (idx !== -1) {
          sourceActivity = program.blocks[i].weeks[j].days[k].activities[idx];
          blockIndex = i;
          weekIndex = j;
          dayIndex = k;
          sourceIndex = idx;
          break;
        }
      }
      if (sourceActivity) break;
    }
    if (sourceActivity) break;
  }

  if (!sourceActivity || blockIndex === -1 || weekIndex === -1 || dayIndex === -1 || sourceIndex === -1) return program;

  const clonedActivity = JSON.parse(JSON.stringify(sourceActivity));
  const copiedActivity = regenerateActivityIds(clonedActivity);
  copiedActivity.order = sourceIndex + 1;

  return produce(program, draft => {
    // Insert after source
    draft.blocks[blockIndex].weeks[weekIndex].days[dayIndex].activities.splice(sourceIndex + 1, 0, copiedActivity);

    // Reorder all subsequent activities
    for (let i = sourceIndex + 2; i < draft.blocks[blockIndex].weeks[weekIndex].days[dayIndex].activities.length; i++) {
      draft.blocks[blockIndex].weeks[weekIndex].days[dayIndex].activities[i].order = i;
    }
  });
}
/**
 * Convert id fields to _id for MongoDB
 * Mongoose requires _id on subdocuments to preserve their IDs
 * Without this, Mongoose treats them as new documents and regenerates IDs
 */
export function convertIdsToMongoose(program: IProgram): any {
  return {
    ...program,
    _id: program.id,
    blocks: program.blocks.map(block => ({
      ...(!block.id.startsWith('temp_') && { _id: block.id }),
      name: block.name,
      order: block.order,
      activityGroupTargets: block.activityGroupTargets.map(target => ({
        activityGroupId: target.activityGroupId,
        targetPercentage: target.targetPercentage,
      })),
      weeks: block.weeks.map(week => ({
        ...(!week.id.startsWith('temp_') && { _id: week.id }),
        name: week.name,
        order: week.order,
        activityGroupTargets: week.activityGroupTargets.map(target => ({
          activityGroupId: target.activityGroupId,
          targetPercentage: target.targetPercentage,
        })),
        days: week.days.map(day => ({
          ...(!day.id.startsWith('temp_') && { _id: day.id }),
          name: day.name,
          order: day.order,
          activities: day.activities.map(activity => ({
            ...(!activity.id.startsWith('temp_') && { _id: activity.id }),
            type: activity.type,
            order: activity.order,
            activityTemplateId: activity.activityTemplateId,
            // Include type-specific fields
            ...(activity.type === 'lift' && {
              sets: activity.sets,
            }),
            ...(activity.type === 'cardio' && {
              cardioType: activity.cardioType,
              time: activity.time,
              distance: activity.distance,
              distanceUnit: activity.distanceUnit,
              repetitions: activity.repetitions,
              templateSubMaxId: activity.templateSubMaxId,
              percentageOfMax: activity.percentageOfMax,
            }),
          })),
        })),
      })),
    })),
  };
}
