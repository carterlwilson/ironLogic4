import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { notifications } from '@mantine/notifications';
import type { AuthTokens } from '@ironlogic4/shared';

interface LoginCredentials {
  email: string;
  password: string;
}

interface AuthError {
  message: string;
  field?: string;
}

interface User {
  id: string;
  email: string;
  role: 'admin' | 'owner' | 'coach' | 'client';
  firstName?: string;
  lastName?: string;
  gymId?: string;
  gymName?: string;
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: AuthError | null;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; user?: User; tokens?: AuthTokens; error?: AuthError }>;
  logout: () => void;
  clearError: () => void;
  initializeAuth: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: false,
    error: null,
    isAuthenticated: false,
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));

        const authError: AuthError = {
          message: errorData.message || 'Login failed. Please check your credentials.',
          field: undefined,
        };

        if (response.status === 401) {
          authError.message = 'Invalid email or password.';
        } else if (response.status === 429) {
          authError.message = 'Too many login attempts. Please try again later.';
        }

        setAuthState(prev => ({
          ...prev,
          isLoading: false,
          error: authError,
          isAuthenticated: false,
        }));

        notifications.show({
          title: 'Login Failed',
          message: authError.message,
          color: 'red',
          autoClose: 5000,
        });

        return { success: false, error: authError };
      }

      const responseData = await response.json();
      const { user: serverUser, token } = responseData.data;
      const tokens = { accessToken: token };
      const user = { ...serverUser, role: serverUser.userType };

      // Store tokens in localStorage for persistence
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        tokens,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });

      notifications.show({
        title: 'Login Successful',
        message: `Welcome back, ${user.firstName || user.email}!`,
        color: 'green',
        autoClose: 3000,
      });

      return { success: true, user, tokens };
    } catch (error: any) {
      console.error('Login error:', error);

      const authError: AuthError = {
        message: !navigator.onLine
          ? 'No internet connection. Please check your network.'
          : 'Login failed. Please try again.',
        field: undefined,
      };

      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: authError,
        isAuthenticated: false,
      }));

      notifications.show({
        title: 'Login Failed',
        message: authError.message,
        color: 'red',
        autoClose: 5000,
      });

      return { success: false, error: authError };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('authTokens');
    localStorage.removeItem('user');

    setAuthState({
      user: null,
      tokens: null,
      isLoading: false,
      error: null,
      isAuthenticated: false,
    });

    notifications.show({
      title: 'Logged Out',
      message: 'You have been successfully logged out.',
      color: 'blue',
      autoClose: 3000,
    });
  }, []);

  const clearError = useCallback(() => {
    setAuthState(prev => ({ ...prev, error: null }));
  }, []);

  const initializeAuth = useCallback(() => {
    try {
      const storedTokens = localStorage.getItem('authTokens');
      const storedUser = localStorage.getItem('user');

      if (storedTokens && storedUser) {
        const tokens = JSON.parse(storedTokens);
        const user = JSON.parse(storedUser);

        setAuthState({
          user,
          tokens,
          isLoading: false,
          error: null,
          isAuthenticated: true,
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth state:', error);
      localStorage.removeItem('authTokens');
      localStorage.removeItem('user');
    }
  }, []);

  // Automatically initialize auth state when provider mounts
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    clearError,
    initializeAuth,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}