import { Alert } from '@mantine/core';
import { IconInfoCircle } from '@tabler/icons-react';

const CLOSURE_DATE = '2026-09-07'; // Labor Day 2026
const CLOSURE_LABEL = 'Monday, September 7';

/** Whether the closure date hasn't passed yet, so the reminder banner is still relevant. */
function isClosureUpcoming(now: Date = new Date()): boolean {
  const endOfClosureDay = new Date(`${CLOSURE_DATE}T23:59:59`);
  return now <= endOfClosureDay;
}

export function ClosureBanner() {
  if (!isClosureUpcoming()) return null;

  return (
    <Alert icon={<IconInfoCircle size={16} />} color="yellow" variant="light" mb="md">
      Cully Strength will be closed on {CLOSURE_LABEL} for Labor Day — no classes will be held. Open
      gym will be held on Monday, ask your coach about times.
    </Alert>
  );
}
