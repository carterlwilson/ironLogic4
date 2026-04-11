import { useAuth } from '../providers/AuthProvider';
import { ClientScheduleView } from '../components/schedule/ClientScheduleView';
import { CoachScheduleView } from '../components/schedule/CoachScheduleView';

export const SchedulePage = () => {
  const { user } = useAuth();
  const isCoachView = user && ['coach', 'owner', 'admin'].includes(user.role);
  return isCoachView ? <CoachScheduleView /> : <ClientScheduleView />;
};
