import { useState } from 'react';
import { toDateString, type AttendanceGroupBy } from '@ironlogic4/shared';

/**
 * Date range + grouping state for attendance reports. Defaults to the last 4 weeks.
 */
export function useAttendanceRange() {
  const today = new Date();
  const [from, setFrom] = useState(() =>
    toDateString(new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() - 21))
  );
  const [to, setTo] = useState(() => toDateString(today));
  const [groupBy, setGroupBy] = useState<AttendanceGroupBy>('week');

  return { from, to, groupBy, setFrom, setTo, setGroupBy };
}
