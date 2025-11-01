import { DayOfWeek } from '@ironlogic4/shared';

/**
 * Get the full name of a day from its enum value
 */
export function getDayName(dayOfWeek: DayOfWeek): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return dayNames[dayOfWeek] || 'Unknown';
}

/**
 * Get the short name of a day from its enum value
 */
export function getShortDayName(dayOfWeek: DayOfWeek): string {
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return dayNames[dayOfWeek] || 'Unknown';
}

/**
 * Format a time string for display (converts 24-hour to 12-hour AM/PM format)
 * @param time - Time string in HH:mm format (e.g., "09:00", "14:30")
 * @returns Formatted time in 12-hour AM/PM format (e.g., "9:00 AM", "2:30 PM")
 */
export function formatTime(time: string): string {
  // Parse the time string
  const [hourStr, minuteStr] = time.split(':');
  const hour = parseInt(hourStr, 10);
  const minute = minuteStr;

  // Handle invalid input
  if (isNaN(hour) || !minute) {
    return time;
  }

  // Determine AM/PM
  const period = hour >= 12 ? 'PM' : 'AM';

  // Convert to 12-hour format
  // Special cases: 0 (midnight) becomes 12, 12 (noon) stays 12
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

  return `${displayHour}:${minute} ${period}`;
}

/**
 * Format a time range for display
 */
export function formatTimeRange(startTime: string, endTime: string): string {
  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

/**
 * Get all days of the week as options for selects
 */
export function getAllDayOptions() {
  return [
    { value: DayOfWeek.SUNDAY.toString(), label: 'Sunday' },
    { value: DayOfWeek.MONDAY.toString(), label: 'Monday' },
    { value: DayOfWeek.TUESDAY.toString(), label: 'Tuesday' },
    { value: DayOfWeek.WEDNESDAY.toString(), label: 'Wednesday' },
    { value: DayOfWeek.THURSDAY.toString(), label: 'Thursday' },
    { value: DayOfWeek.FRIDAY.toString(), label: 'Friday' },
    { value: DayOfWeek.SATURDAY.toString(), label: 'Saturday' },
  ];
}

/**
 * Validate time format (HH:mm)
 */
export function isValidTimeFormat(time: string): boolean {
  const timeFormatRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeFormatRegex.test(time);
}

/**
 * Validate that end time is after start time
 */
export function isEndTimeAfterStartTime(startTime: string, endTime: string): boolean {
  if (!isValidTimeFormat(startTime) || !isValidTimeFormat(endTime)) {
    return false;
  }

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);
  const startMinutes = startHour * 60 + startMin;
  const endMinutes = endHour * 60 + endMin;

  return endMinutes > startMinutes;
}

/**
 * Generate a unique ID for timeslots
 */
export function generateTimeslotId(): string {
  return `ts_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}