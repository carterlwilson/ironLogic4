import { useState, useCallback } from 'react';
import axios from 'axios';
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
}

interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isLoading: boolean;
  error: AuthError | null;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    tokens: null,
    isLoading: false,
    error: null,
  });

  const login = useCallback(async (credentials: LoginCredentials) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, credentials, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const { user, tokens } = response.data;

      // Store tokens in localStorage for persistence
      localStorage.setItem('authTokens', JSON.stringify(tokens));
      localStorage.setItem('user', JSON.stringify(user));

      setAuthState({
        user,
        tokens,
        isLoading: false,
        error: null,
      });

      notifications.show({
        title: 'Login Successful',
        message: `Welcome back, ${user.firstName || user.email}!`,
        color: 'forestGreen',
        autoClose: 3000,
      });

      return { success: true, user, tokens };
    } catch (error: any) {
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

  // Initialize auth state from localStorage on hook creation
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
        });
      }
    } catch (error) {
      console.error('Failed to initialize auth state:', error);
      localStorage.removeItem('authTokens');
      localStorage.removeItem('user');
    }
  }, []);

  return {
    ...authState,
    login,
    logout,
    clearError,
    initializeAuth,
    isAuthenticated: !!authState.user,
  };
};