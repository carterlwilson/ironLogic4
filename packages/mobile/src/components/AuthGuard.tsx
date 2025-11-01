import { ReactNode, useEffect, useState } from 'react';
import { LoadingOverlay } from '@mantine/core';
import { useAuth } from '../providers/AuthProvider';
import { LoginPage } from '../pages/LoginPage';

interface AuthGuardProps {
  children: ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { isAuthenticated, initializeAuth } = useAuth();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    // Give the auth provider time to initialize from localStorage
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [initializeAuth]);

  if (isInitializing) {
    return <LoadingOverlay visible />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <>{children}</>;
}