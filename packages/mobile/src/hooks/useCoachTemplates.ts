import { useState, useCallback, useEffect } from 'react';
import { notifications } from '@mantine/notifications';
import { useAuth } from '../providers/AuthProvider';
import type { IScheduleTemplate, ITemplateClient } from '@ironlogic4/shared';
import {
  getTemplates,
  getTemplateClients,
  assignClientToTemplate,
  removeClientFromTemplate,
  getGymClients,
  ClientSummary,
} from '../services/scheduleApi';

export function useCoachTemplates() {
  const { user } = useAuth();
  const [templates, setTemplates] = useState<IScheduleTemplate[]>([]);
  const [clientsMap, setClientsMap] = useState<Record<string, ITemplateClient[]>>({});
  const [allClients, setAllClients] = useState<ClientSummary[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [addModalTemplateId, setAddModalTemplateId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [allClientsLoading, setAllClientsLoading] = useState(false);
  const [removingClientId, setRemovingClientId] = useState<string | null>(null);
  const [addingClientId, setAddingClientId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await getTemplates();
      const myTemplates = (res.data || [])
        .filter(t => t.coachId === user.id)
        .sort((a, b) => ((a.dayOfWeek + 6) % 7) - ((b.dayOfWeek + 6) % 7));
      setTemplates(myTemplates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load templates');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const loadClientsForTemplate = useCallback(async (templateId: string) => {
    setClientsLoading(true);
    try {
      const res = await getTemplateClients(templateId);
      setClientsMap(prev => ({ ...prev, [templateId]: res.data || [] }));
    } catch {
      // silently fail — empty list shown
    } finally {
      setClientsLoading(false);
    }
  }, []);

  const toggleExpand = useCallback((templateId: string) => {
    setExpandedId(prev => {
      if (prev === templateId) return null;
      loadClientsForTemplate(templateId);
      return templateId;
    });
  }, [loadClientsForTemplate]);

  const loadAllClients = useCallback(async (search?: string) => {
    setAllClientsLoading(true);
    try {
      const res = await getGymClients({ search, limit: 100 });
      setAllClients(res.data || []);
    } catch {
      setAllClients([]);
    } finally {
      setAllClientsLoading(false);
    }
  }, []);

  const openAddModal = useCallback((templateId: string) => {
    setAddModalTemplateId(templateId);
    loadAllClients();
  }, [loadAllClients]);

  const closeAddModal = useCallback(() => {
    setAddModalTemplateId(null);
  }, []);

  const searchAllClients = useCallback((search: string) => {
    loadAllClients(search);
  }, [loadAllClients]);

  const addClient = useCallback(async (templateId: string, clientId: string) => {
    setAddingClientId(clientId);
    try {
      await assignClientToTemplate(templateId, clientId);
      await loadClientsForTemplate(templateId);
      setTemplates(prev => prev.map(t =>
        t.id === templateId ? { ...t, assignedCount: (t.assignedCount ?? 0) + 1 } : t
      ));
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to add client',
        color: 'red',
      });
    } finally {
      setAddingClientId(null);
    }
  }, [loadClientsForTemplate]);

  const removeClient = useCallback(async (templateId: string, clientId: string) => {
    setRemovingClientId(clientId);
    try {
      await removeClientFromTemplate(templateId, clientId);
      setClientsMap(prev => ({
        ...prev,
        [templateId]: (prev[templateId] || []).filter(c => c.clientId !== clientId),
      }));
      setTemplates(prev => prev.map(t =>
        t.id === templateId ? { ...t, assignedCount: Math.max(0, (t.assignedCount ?? 1) - 1) } : t
      ));
    } catch (err) {
      notifications.show({
        title: 'Error',
        message: err instanceof Error ? err.message : 'Failed to remove client',
        color: 'red',
      });
    } finally {
      setRemovingClientId(null);
    }
  }, []);

  return {
    templates,
    clientsMap,
    allClients,
    expandedId,
    addModalTemplateId,
    loading,
    clientsLoading,
    allClientsLoading,
    removingClientId,
    addingClientId,
    error,
    toggleExpand,
    openAddModal,
    closeAddModal,
    addClient,
    removeClient,
    searchAllClients,
  };
}
