import { useAuth } from '../providers/AuthProvider';

export function useAppTitle(): string {
  const { user } = useAuth();

  if (!user) return 'IronLogic';
  if (user.role === 'admin') return 'IronLogic';

  return user.gymName || 'IronLogic';
}
