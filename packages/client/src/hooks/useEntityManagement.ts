import { useState, useCallback } from 'react';
import { notifications } from '@mantine/notifications';

export interface PaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EntityManagementState<T> {
  items: T[];
  pagination: PaginationData | null;
  loading: boolean;
  error: string | null;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  isDeleteModalOpen: boolean;
  selectedItem: T | null;
}

interface EntityManagementApi<T, CreateReq, UpdateReq, ListParams> {
  list: (params: ListParams) => Promise<{ data?: T[]; pagination: PaginationData }>;
  create: (data: CreateReq) => Promise<any>;
  update: (id: string, data: UpdateReq) => Promise<any>;
  delete: (id: string) => Promise<any>;
}

interface UseEntityManagementOptions<T, CreateReq, UpdateReq, ListParams> {
  api: EntityManagementApi<T, CreateReq, UpdateReq, ListParams>;
  entityLabel: string;
  defaultParams: ListParams;
}

export function useEntityManagement<T, CreateReq, UpdateReq, ListParams>(
  options: UseEntityManagementOptions<T, CreateReq, UpdateReq, ListParams>
) {
  const { api, entityLabel, defaultParams } = options;

  const [state, setState] = useState<EntityManagementState<T>>({
    items: [],
    pagination: null,
    loading: false,
    error: null,
    isAddModalOpen: false,
    isEditModalOpen: false,
    isDeleteModalOpen: false,
    selectedItem: null,
  });
  const [lastParams, setLastParams] = useState<ListParams>(defaultParams);

  const loadItems = useCallback(async (params: ListParams = defaultParams) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    setLastParams(params);
    try {
      const response = await api.list(params);
      setState(prev => ({
        ...prev,
        items: response.data || [],
        pagination: response.pagination,
        loading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to load ${entityLabel.toLowerCase()}s`;
      setState(prev => ({ ...prev, loading: false, error: errorMessage }));
      notifications.show({ title: 'Error', message: errorMessage, color: 'red', autoClose: 5000 });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const createItem = useCallback(async (data: CreateReq): Promise<any> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      const response = await api.create(data);
      setState(prev => ({ ...prev, isAddModalOpen: false, loading: false }));
      notifications.show({ title: 'Success', message: `${entityLabel} created successfully`, color: 'green', autoClose: 3000 });
      await loadItems(lastParams);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to create ${entityLabel.toLowerCase()}`;
      setState(prev => ({ ...prev, loading: false }));
      notifications.show({ title: 'Error', message: errorMessage, color: 'red', autoClose: 5000 });
      return undefined;
    }
  }, [loadItems, lastParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateItem = useCallback(async (id: string, data: UpdateReq): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await api.update(id, data);
      setState(prev => ({ ...prev, isEditModalOpen: false, selectedItem: null, loading: false }));
      notifications.show({ title: 'Success', message: `${entityLabel} updated successfully`, color: 'green', autoClose: 3000 });
      await loadItems(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to update ${entityLabel.toLowerCase()}`;
      setState(prev => ({ ...prev, loading: false }));
      notifications.show({ title: 'Error', message: errorMessage, color: 'red', autoClose: 5000 });
    }
  }, [loadItems, lastParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteItem = useCallback(async (id: string): Promise<void> => {
    setState(prev => ({ ...prev, loading: true }));
    try {
      await api.delete(id);
      setState(prev => ({ ...prev, isDeleteModalOpen: false, selectedItem: null, loading: false }));
      notifications.show({ title: 'Success', message: `${entityLabel} deleted successfully`, color: 'green', autoClose: 3000 });
      await loadItems(lastParams);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : `Failed to delete ${entityLabel.toLowerCase()}`;
      setState(prev => ({ ...prev, loading: false }));
      notifications.show({ title: 'Error', message: errorMessage, color: 'red', autoClose: 5000 });
    }
  }, [loadItems, lastParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const openAddModal = useCallback(() => setState(prev => ({ ...prev, isAddModalOpen: true })), []);

  const openEditModal = useCallback((item: T) => setState(prev => ({
    ...prev, isEditModalOpen: true, selectedItem: item,
  })), []);

  const openDeleteModal = useCallback((item: T) => setState(prev => ({
    ...prev, isDeleteModalOpen: true, selectedItem: item,
  })), []);

  const closeModals = useCallback(() => setState(prev => ({
    ...prev, isAddModalOpen: false, isEditModalOpen: false, isDeleteModalOpen: false, selectedItem: null,
  })), []);

  const refresh = useCallback(() => loadItems(lastParams), [loadItems, lastParams]);

  return {
    ...state,
    loadItems,
    createItem,
    updateItem,
    deleteItem,
    openAddModal,
    openEditModal,
    openDeleteModal,
    closeModals,
    refresh,
  };
}
