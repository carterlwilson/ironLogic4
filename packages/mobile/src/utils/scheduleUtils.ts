import { DayOfWeek } from '@ironlogic4/shared';
import type { FlatTimeslot } from '../hooks/useSchedule';

/**
 * Convert 24-hour time format to 12-hour with AM/PM
 * @param time - Time in "HH:mm" format (e.g., "09:00", "14:30")
 * @returns Time in "h:mm AM/PM" format (e.g., "9:00 AM", "2:30 PM")
 */
export function formatTime(time: string): string {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

/**
 * Format a time range
 * @param start - Start time in "HH:mm" format
 * @param end - End time in "HH:mm" format
 * @returns Time range (e.g., "9:00 AM - 10:00 AM")
 */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} - ${formatTime(end)}`;
}

/**
 * Get day name from day of week number
 * @param dayOfWeek - Day number (0-6, Sunday-Saturday)
 * @returns Day name (e.g., "Monday")
 */
export function getDayName(dayOfWeek: DayOfWeek | number): string {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[dayOfWeek] || 'Unknown';
}

/**
 * Get abbreviated day name
 * @param dayOfWeek - Day number (0-6, Sunday-Saturday)
 * @returns Abbreviated day name (e.g., "Mon")
 */
export function getShortDayName(dayOfWeek: DayOfWeek | number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[dayOfWeek] || 'Unknown';
}

/**
 * Format capacity display
 * @param availableSpots - Number of available spots
 * @param capacity - Total capacity
 * @returns Formatted string (e.g., "3/10 spots")
 */
export function formatCapacity(availableSpots: number, capacity: number): string {
  const filled = capacity - availableSpots;
  return `${filled}/${capacity} spots`;
}

/**
 * Get color for capacity indicator
 * @param availableSpots - Number of available spots
 * @param capacity - Total capacity
 * @returns Color name for Mantine components
 */
export function getCapacityColor(availableSpots: number, capacity: number): string {
  const percentFilled = ((capacity - availableSpots) / capacity) * 100;

  if (percentFilled >= 100) return 'red';
  if (percentFilled >= 75) return 'orange';
  if (percentFilled >= 50) return 'yellow';
  return 'green';
}

/**
 * Group flat timeslots by day of week, splitting each day into AM/PM sections
 * @param slots - Flat list of timeslots
 * @returns Map of dayOfWeek to { am, pm } slot arrays, sorted by startTime ascending.
 *          Days with no slots are omitted.
 */
export function groupSlotsByDay(
  slots: FlatTimeslot[]
): Map<number, { am: FlatTimeslot[]; pm: FlatTimeslot[] }> {
  const grouped = new Map<number, { am: FlatTimeslot[]; pm: FlatTimeslot[] }>();

  for (const slot of slots) {
    if (!grouped.has(slot.dayOfWeek)) {
      grouped.set(slot.dayOfWeek, { am: [], pm: [] });
    }
    const day = grouped.get(slot.dayOfWeek)!;
    if (slot.startTime < '12:00') {
      day.am.push(slot);
    } else {
      day.pm.push(slot);
    }
  }

  for (const day of grouped.values()) {
    day.am.sort((a, b) => a.startTime.localeCompare(b.startTime));
    day.pm.sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  for (const [dayOfWeek, day] of grouped) {
    if (day.am.length + day.pm.length === 0) {
      grouped.delete(dayOfWeek);
    }
  }

  return grouped;
}