import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import axios from 'axios';
import { notifications } from '@mantine/notifications';
import type { AuthTokens } from '@ironlogic4/shared';
import { redirectToMobileApp, shouldRedirectToMobile } from '../utils/redirectToMobile';

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
      const response = await axios.post(`${API_BASE_URL}/api/auth/login`, credentials, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { user: serverUser, accessToken, refreshToken } = response.data.data;
      const tokens = { accessToken, refreshToken };
      const user = { ...serverUser, role: serverUser.userType };

      // Store both tokens in localStorage for persistence
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        tokens,
        isLoading: false,
        error: null,
        isAuthenticated: true,
      });

      // Check if user is client-type and redirect to mobile
      if (shouldRedirectToMobile(user)) {
        // Clear client app's localStorage before redirect
        localStorage.removeItem('authTokens');
        localStorage.removeItem('user');

        redirectToMobileApp(tokens, user);
        return { success: true, user, tokens }; // Redirect in progress
      }

      notifications.show({
        title: 'Login Successful',
        message: `Welcome back, ${user.firstName || user.email}!`,
        color: 'forestGreen',
        autoClose: 3000,
      });

      return { success: true, user, tokens };
    } catch (error: any) {
      console.error('❌ Login error caught:', error);

      const authError: AuthError = {
        message: 'Login failed. Please check your credentials.',
        field: undefined,
      };

      if (axios.isAxiosError(error)) {
        if (error.code === 'ECONNABORTED') {
          authError.message = 'Request timed out. Please try again.';
        } else if (error.response?.status === 401) {
          authError.message = 'Invalid email or password.';
        } else if (error.response?.status === 429) {
          authError.message = 'Too many login attempts. Please try again later.';
        } else if (error.response?.data?.message) {
          authError.message = error.response.data.message;
        } else if (!navigator.onLine) {
          authError.message = 'No internet connection. Please check your network.';
        }
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

        // Validate token structure - if accessToken is null/undefined, clear old tokens
        if (!tokens.accessToken || tokens.accessToken === 'undefined' || tokens.accessToken === 'null') {
          console.warn('Invalid token structure detected, clearing auth state');
          localStorage.removeItem('authTokens');
          localStorage.removeItem('user');
          return;
        }

        // Check if client user trying to access web app
        if (shouldRedirectToMobile(user)) {
          // Clear client app's localStorage before redirect
          localStorage.removeItem('authTokens');
          localStorage.removeItem('user');

          redirectToMobileApp(tokens, user);
          return; // Redirect in progress, don't set state
        }

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