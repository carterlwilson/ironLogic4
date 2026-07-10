import { Request } from 'express';
import { DeletedUserLog } from '../models/DeletedUserLog.js';
import { UserDocument } from '../models/User.js';

// Fire-and-forget: an audit-log write failure must never turn a successful
// user deletion into a failed request, so errors are caught and logged here
// rather than propagated to the caller.
export async function logUserDeletion(
  deletedUser: UserDocument,
  actor: UserDocument | undefined,
  req: Request,
  source: string
): Promise<void> {
  try {
    const requestIp = (req.headers['cf-connecting-ip'] || req.headers['x-forwarded-for'] || req.ip) as string | undefined;

    await DeletedUserLog.create({
      deletedUserId: deletedUser.id,
      email: deletedUser.email,
      firstName: deletedUser.firstName,
      lastName: deletedUser.lastName,
      userType: deletedUser.userType,
      gymId: deletedUser.gymId,
      status: deletedUser.status,
      currentBenchmarksCount: deletedUser.currentBenchmarks?.length ?? 0,
      historicalBenchmarksCount: deletedUser.historicalBenchmarks?.length ?? 0,
      accountCreatedAt: (deletedUser as any).createdAt,
      hadActiveSessions: (deletedUser.refreshTokens?.length ?? 0) > 0,
      deletedBy: actor
        ? { id: actor.id, email: actor.email, userType: actor.userType }
        : { id: 'unknown', email: 'unknown', userType: 'unknown' },
      deletedVia: source,
      requestIp,
      requestUserAgent: req.headers['user-agent'],
    });
  } catch (error) {
    console.error(`[DELETED_USER_LOG] Failed to record deletion audit log (source: ${source}):`, error);
  }
}
