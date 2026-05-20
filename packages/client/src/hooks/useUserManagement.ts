import { useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { User } from '@ironlogic4/shared/types/users';
import { userApi, UserListParams, CreateUserRequest, UpdateUserRequest, ResetPasswordRequest } from '../services/userApi';
import { useEntityManagement, PaginationData } from './useEntityManagement';

interface UseUserManagementReturn {
  users: User[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedUser: User | null;
  loadUsers: (params?: UserListParams) => Promise<void>;
  createUser: (data: CreateUserRequest) => Promise<void>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  resetPassword: (id: string, data: ResetPasswordRequest) => Promise<string | undefined>;
  openAddModal: () => void;
  openEditModal: (user: User) => void;
  openDeleteModal: (user: User) => void;
  closeModals: () => void;
  refreshUsers: () => Promise<void>;
}

export const useUserManagement = (): UseUserManagementReturn => {
  const mgmt = useEntityManagement<User, CreateUserRequest, UpdateUserRequest, UserListParams>({
    api: {
      list: userApi.getUsers,
      create: userApi.createUser,
      update: (id, data) => userApi.updateUser(id, data),
      delete: userApi.deleteUser,
    },
    entityLabel: 'User',
    defaultParams: {},
  });

  const resetPassword = useCallback(async (id: string, data: ResetPasswordRequest): Promise<string | undefined> => {
    try {
      const response = await userApi.resetPassword(id, data);
      notifications.show({ title: 'Success', message: 'Password reset successfully', color: 'green', autoClose: 3000 });
      return response.data?.newPassword;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to reset password';
      notifications.show({ title: 'Error', message: errorMessage, color: 'red', autoClose: 5000 });
      throw error;
    }
  }, []);

  return {
    users: mgmt.items,
    pagination: mgmt.pagination,
    loading: mgmt.loading,
    error: mgmt.error,
    isAddModalOpen: mgmt.isAddModalOpen,
    isEditModalOpen: mgmt.isEditModalOpen,
    isDeleteModalOpen: mgmt.isDeleteModalOpen,
    selectedUser: mgmt.selectedItem,
    loadUsers: mgmt.loadItems,
    createUser: async (data) => { await mgmt.createItem(data); },
    updateUser: mgmt.updateItem,
    deleteUser: mgmt.deleteItem,
    resetPassword,
    openAddModal: mgmt.openAddModal,
    openEditModal: mgmt.openEditModal,
    openDeleteModal: mgmt.openDeleteModal,
    closeModals: mgmt.closeModals,
    refreshUsers: mgmt.refresh,
  };
};
