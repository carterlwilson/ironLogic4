import type { User } from '@ironlogic4/shared/types/users';
import { clientApi, ClientListParams, CreateClientRequest, UpdateClientRequest } from '../services/clientApi';
import { useEntityManagement, PaginationData } from './useEntityManagement';

interface UseClientManagementReturn {
  clients: User[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedClient: User | null;
  loadClients: (params?: ClientListParams) => Promise<void>;
  createClient: (data: CreateClientRequest) => Promise<string | undefined>;
  updateClient: (id: string, data: UpdateClientRequest) => Promise<void>;
  deleteClient: (id: string) => Promise<void>;
  openAddModal: () => void;
  openEditModal: (client: User) => void;
  openDeleteModal: (client: User) => void;
  closeModals: () => void;
  refreshClients: () => Promise<void>;
}

export const useClientManagement = (): UseClientManagementReturn => {
  const mgmt = useEntityManagement<User, CreateClientRequest, UpdateClientRequest, ClientListParams>({
    api: {
      list: clientApi.getClients,
      create: clientApi.createClient,
      update: (id, data) => clientApi.updateClient(id, data),
      delete: clientApi.deleteClient,
    },
    entityLabel: 'Client',
    defaultParams: {},
  });

  return {
    clients: mgmt.items,
    pagination: mgmt.pagination,
    loading: mgmt.loading,
    error: mgmt.error,
    isAddModalOpen: mgmt.isAddModalOpen,
    isEditModalOpen: mgmt.isEditModalOpen,
    isDeleteModalOpen: mgmt.isDeleteModalOpen,
    selectedClient: mgmt.selectedItem,
    loadClients: mgmt.loadItems,
    createClient: async (data) => {
      const response = await mgmt.createItem(data);
      if (!response) throw new Error('Failed to create client');
      return response.data?.generatedPassword;
    },
    updateClient: mgmt.updateItem,
    deleteClient: mgmt.deleteItem,
    openAddModal: mgmt.openAddModal,
    openEditModal: mgmt.openEditModal,
    openDeleteModal: mgmt.openDeleteModal,
    closeModals: mgmt.closeModals,
    refreshClients: mgmt.refresh,
  };
};
