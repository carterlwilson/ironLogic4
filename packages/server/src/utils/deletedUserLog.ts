import { DeletedUserLog } from '../models/DeletedUserLog.js';
import { UserDocument } from '../models/User.js';

// Fire-and-forget: an audit-log write failure must never turn a successful
// user deletion into a failed request, so errors are caught and logged here
// rather than propagated to the caller.
export async function logUserDeletion(
  deletedUser: UserDocument,
  actor: UserDocument | undefined,
  source: string
): Promise<void> {
  try {
    await DeletedUserLog.create({
      email: deletedUser.email,
      firstName: deletedUser.firstName,
      lastName: deletedUser.lastName,
      deletedBy: actor
        ? { id: actor.id, email: actor.email, userType: actor.userType }
        : { id: 'unknown', email: 'unknown', userType: 'unknown' },
      deletedVia: source,
    });
  } catch (error) {
    console.error(`[DELETED_USER_LOG] Failed to record deletion audit log (source: ${source}):`, error);
  }
}
