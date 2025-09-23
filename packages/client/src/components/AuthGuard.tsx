import { LoadingOverlay } from '@mantine/core';
import { useAuth } from '../providers/AuthProvider';
import { LoginPage } from '../pages/LoginPage';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  // Debug: Log when AuthGuard renders and what the auth state is
  console.log('🛡️ AuthGuard render:', { isAuthenticated, isLoading });

  // Show loading while checking authentication
  if (isLoading) {
    return <LoadingOverlay visible={true} />;
  }

  // If not authenticated, show login page
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // If authenticated, show protected content
  return <>{children}</>;
}