import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { User } from '@ironlogic4/shared/types/users';
import { userApi, UserListParams, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest } from '../services/userApi';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseUserManagementState {
  // Data
  users: User[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;

  // UI State
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedUser: User | null;
}

interface UseUserManagementReturn extends UseUserManagementState {
  // Actions
  loadUsers: (params?: UserListParams) => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<void>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetPassword: (id: string, data: ResetPasswordRequest) => Promise<string | undefined>;

  // Modal Controls
  openAddModal: () => void;
  openEditModal: (user: User) => void;
  openDeleteModal: (user: User) => void;
  closeModals: () => void;

  // Utility
  refreshUsers: () => Promise<void>;
}

const initialState: UseUserManagementState = {
  users: [],
  pagination: null,
  loading: false,
  error: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  selectedUser: null,
};

export const useUserManagement = (): UseUserManagementReturn => {
  const [state, setState] = useState<UseUserManagementState>(initialState);
  const [lastParams, setLastParams] = useState<UserListParams>({});

  const loadUsers = useCallback(async (params: UserListParams = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setLastParams(params);

    try {
      const response = await userApi.getUsers(params);

      setState(prev => ({
        ...prev,
        users: response.data || [],
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load users';
      setState(prev => ({
        ...prev,
        loading: false,
        error: errorMessage,
      }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, []);

  const createUser = useCallback(async (data: CreateUserRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await userApi.createUser(data);

      // Close modal and refresh users
      setState(prev => ({
        ...prev,
        isAddModalOpen: false,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'User created successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the user list
      await loadUsers(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadUsers, lastParams]);

  const updateUser = useCallback(async (id: string, data: UpdateUserRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await userApi.updateUser(id, data);

      // Close modal and refresh users
      setState(prev => ({
        ...prev,
        isEditModalOpen: false,
        selectedUser: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'User updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the user list
      await loadUsers(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update user';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadUsers, lastParams]);

  const deleteUser = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await userApi.deleteUser(id);

      // Close modal and refresh users
      setState(prev => ({
        ...prev,
        isDeleteModalOpen: false,
        selectedUser: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'User deleted successfully',
        color: 'green',
        autoClose: 3000,
      });

      // Refresh the user list
      await loadUsers(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete user';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadUsers, lastParams]);

  const resetPassword = useCallback(async (id: string, data: ResetPasswordRequest): Promise<string | undefined> => {
    try {
      const response = await userApi.resetPassword(id, data);

      notifications.show({
        title: 'Success',
        message: 'Password reset successfully',
        color: 'green',
        autoClose: 3000,
      });

      return response.data?.newPassword;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });

      throw error;
    }
  }, []);

  // Modal Controls
  const openAddModal = useCallback(() => {
    setState(prev => ({ ...prev, isAddModalOpen: true }));
  }, []);

  const openEditModal = useCallback((user: User) => {
    setState(prev => ({
      ...prev,
      isEditModalOpen: true,
      selectedUser: user,
    }));
  }, []);

  const openDeleteModal = useCallback((user: User) => {
    setState(prev => ({
      ...prev,
      isDeleteModalOpen: true,
      selectedUser: user,
    }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      selectedUser: null,
    }));
  }, []);

  const refreshUsers = useCallback(() => {
    return loadUsers(lastParams);
  }, [loadUsers, lastParams]);

  return {
    ...state,
    loadUsers,
    createUser,
    updateUser,
    deleteUser,
    resetPassword,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    refreshUsers,
  };
};