import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import type { User } from '@ironlogic4/shared/types/users';
import { clientApi, ClientListParams, CreateClientRequest, UpdateClientRequest } from '../services/clientApi';

interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface UseClientManagementState {
  clients: User[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedClient: User | null;
}

interface UseClientManagementReturn extends UseClientManagementState {
  loadClients: (params?: ClientListParams) => Promise<void>;
  createClient: (data: CreateClientRequest) => Promise<string | undefined>;
  updateClient: (id: string, data: UpdateClientRequest) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  assignProgram: (clientId: string, programId: string) => Promise<void>;
  unassignProgram: (clientId: string) => Promise<void>;
  openAddModal: () => void;
  openEditModal: (client: User) => void;
  openDeleteModal: (client: User) => void;
  closeModals: () => void;
  refreshClients: () => Promise<void>;
}

const initialState: UseClientManagementState = {
  clients: [],
  pagination: null,
  loading: false,
  error: null,
  isAddModalOpen: false,
  isEditModalOpen: false,
  isDeleteModalOpen: false,
  selectedClient: null,
};

export const useClientManagement = (): UseClientManagementReturn => {
  const [state, setState] = useState<UseClientManagementState>(initialState);
  const [lastParams, setLastParams] = useState<ClientListParams>({});

  const loadClients = useCallback(async (params: ClientListParams = {}) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setLastParams(params);

    try {
      const response = await clientApi.getClients(params);

      setState(prev => ({
        ...prev,
        clients: response.data || [],
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load clients';
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

  const createClient = useCallback(async (data: CreateClientRequest): Promise<string | undefined> => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      const response = await clientApi.createClient(data);

      setState(prev => ({
        ...prev,
        isAddModalOpen: false,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Client created successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadClients(lastParams);

      return response.data?.generatedPassword;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create client';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  }, [loadClients, lastParams]);

  const updateClient = useCallback(async (id: string, data: UpdateClientRequest) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await clientApi.updateClient(id, data);

      setState(prev => ({
        ...prev,
        isEditModalOpen: false,
        selectedClient: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Client updated successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadClients(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update client';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadClients, lastParams]);

  const deleteClient = useCallback(async (id: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await clientApi.deleteClient(id);

      setState(prev => ({
        ...prev,
        isDeleteModalOpen: false,
        selectedClient: null,
        loading: false,
      }));

      notifications.show({
        title: 'Success',
        message: 'Client deleted successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadClients(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete client';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
    }
  }, [loadClients, lastParams]);

  const assignProgram = useCallback(async (clientId: string, programId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await clientApi.assignProgram(clientId, programId);

      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Success',
        message: 'Program assigned successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadClients(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to assign program';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  }, [loadClients, lastParams]);

  const unassignProgram = useCallback(async (clientId: string) => {
    try {
      setState(prev => ({ ...prev, loading: true }));

      await clientApi.unassignProgram(clientId);

      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Success',
        message: 'Program unassigned successfully',
        color: 'green',
        autoClose: 3000,
      });

      await loadClients(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unassign program';
      setState(prev => ({ ...prev, loading: false }));

      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red',
        autoClose: 5000,
      });
      throw error;
    }
  }, [loadClients, lastParams]);

  const openAddModal = useCallback(() => {
    setState(prev => ({ ...prev, isAddModalOpen: true }));
  }, []);

  const openEditModal = useCallback((client: User) => {
    setState(prev => ({
      ...prev,
      isEditModalOpen: true,
      selectedClient: client,
    }));
  }, []);

  const openDeleteModal = useCallback((client: User) => {
    setState(prev => ({
      ...prev,
      isDeleteModalOpen: true,
      selectedClient: client,
    }));
  }, []);

  const closeModals = useCallback(() => {
    setState(prev => ({
      ...prev,
      isAddModalOpen: false,
      isEditModalOpen: false,
      isDeleteModalOpen: false,
      selectedClient: null,
    }));
  }, []);

  const refreshClients = useCallback(() => {
    return loadClients(lastParams);
  }, [loadClients, lastParams]);

  return {
    ...state,
    loadClients,
    createClient,
    updateClient,
    deleteClient,
    assignProgram,
    unassignProgram,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    refreshClients,
  };
};