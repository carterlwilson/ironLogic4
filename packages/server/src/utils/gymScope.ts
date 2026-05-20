import { UserType } from '@ironlogic4/shared/types/users';
import { UserDocument } from '../models/User.js';

export function buildGymScope(
  user: UserDocument,
  requestedGymId?: string
): { gymId?: string } {
  if (user.userType === UserType.OWNER || user.userType === UserType.COACH) {
    return { gymId: user.gymId };
  }
  return requestedGymId ? { gymId: requestedGymId } : {};
}
