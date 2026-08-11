import { User } from '../models/User.js';
import { UserType } from '@ironlogic4/shared';

/**
 * Validate that a client ID exists, belongs to the gym, and has the CLIENT role
 */
export async function validateClientId(clientId: string, gymId: string): Promise<{ valid: boolean; error?: string }> {
  const client = await User.findById(clientId);

  if (!client) {
    return { valid: false, error: 'Client not found' };
  }

  if (client.gymId !== gymId) {
    return { valid: false, error: 'Client must belong to the same gym' };
  }

  if (client.userType !== UserType.CLIENT) {
    return { valid: false, error: 'User must have the client role' };
  }

  return { valid: true };
}
