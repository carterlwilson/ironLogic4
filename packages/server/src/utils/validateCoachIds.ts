import { User } from '../models/User.js';

/**
 * Validate that coach IDs exist, belong to the gym, and have appropriate roles
 */
export async function validateCoachIds(coachIds: string[], gymId: string): Promise<{ valid: boolean; error?: string }> {
  const coaches = await User.find({
    _id: { $in: coachIds },
  });

  if (coaches.length !== coachIds.length) {
    return { valid: false, error: 'One or more coach IDs not found' };
  }

  // Check that all users belong to the gym
  const invalidGym = coaches.find(coach => coach.gymId !== gymId);
  if (invalidGym) {
    return { valid: false, error: 'All coaches must belong to the same gym' };
  }

  // Check that all users have appropriate roles
  const invalidRole = coaches.find(
    coach => !['coach', 'admin', 'owner'].includes(coach.userType)
  );
  if (invalidRole) {
    return { valid: false, error: 'Coach IDs must refer to users with coach, admin, or owner roles' };
  }

  return { valid: true };
}
