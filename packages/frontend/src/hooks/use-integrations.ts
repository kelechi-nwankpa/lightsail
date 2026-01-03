import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../lib/api';
import type {
  IntegrationListItem,
  IntegrationDetail,
  IntegrationTypeInfo,
  IntegrationFilters,
  ConnectIntegrationInput,
  UpdateIntegrationInput,
  SyncResult,
  TestConnectionResult,
  IntegrationLog,
} from '../types/integrations';

/**
 * Hook to fetch and manage the list of integrations
 */
export function useIntegrations(initialFilters: IntegrationFilters = {}) {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [integrations, setIntegrations] = useState<IntegrationListItem[]>([]);
  const [filters, setFilters] = useState<IntegrationFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Set up token getter
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchIntegrations = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !orgId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<IntegrationListItem[]>('/integrations');

      // Apply client-side filters if needed
      let filtered = data;
      if (filters.type) {
        filtered = filtered.filter((i) => i.type === filters.type);
      }
      if (filters.status) {
        filtered = filtered.filter((i) => i.status === filters.status);
      }

      setIntegrations(filtered);
    } catch (err) {
      console.error('Failed to fetch integrations:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch integrations'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoaded, isSignedIn, orgId]);

  useEffect(() => {
    fetchIntegrations();
  }, [fetchIntegrations]);

  const updateFilters = useCallback((newFilters: Partial<IntegrationFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  return {
    integrations,
    filters,
    isLoading,
    error,
    refetch: fetchIntegrations,
    updateFilters,
  };
}

/**
 * Hook to fetch a single integration's details
 */
export function useIntegrationDetail(id: string | null) {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [integration, setIntegration] = useState<IntegrationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Set up token getter
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchIntegration = useCallback(async () => {
    if (!id || !isLoaded || !isSignedIn || !orgId) {
      setIntegration(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<IntegrationDetail>(`/integrations/${id}`);
      setIntegration(data);
    } catch (err) {
      console.error('Failed to fetch integration:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch integration'));
      setIntegration(null);
    } finally {
      setIsLoading(false);
    }
  }, [id, isLoaded, isSignedIn, orgId]);

  useEffect(() => {
    fetchIntegration();
  }, [fetchIntegration]);

  return {
    integration,
    isLoading,
    error,
    refetch: fetchIntegration,
  };
}

/**
 * Hook to fetch integration logs
 */
export function useIntegrationLogs(integrationId: string | null, page = 1, pageSize = 20) {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Set up token getter
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchLogs = useCallback(async () => {
    if (!integrationId || !isLoaded || !isSignedIn || !orgId) {
      setLogs([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.getWithPagination<IntegrationLog[]>(
        `/integrations/${integrationId}/logs?page=${page}&pageSize=${pageSize}`
      );
      setLogs(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch integration logs:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch logs'));
    } finally {
      setIsLoading(false);
    }
  }, [integrationId, page, pageSize, isLoaded, isSignedIn, orgId]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return {
    logs,
    pagination,
    isLoading,
    error,
    refetch: fetchLogs,
  };
}

/**
 * Hook to fetch available integration types
 */
export function useIntegrationTypes() {
  const { isLoaded, isSignedIn, getToken } = useAuth();

  const [types, setTypes] = useState<IntegrationTypeInfo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Set up token getter
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchTypes = useCallback(async () => {
    if (!isLoaded || !isSignedIn) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await api.get<IntegrationTypeInfo[]>('/integrations/types');
      setTypes(data);
    } catch (err) {
      console.error('Failed to fetch integration types:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch integration types'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  return {
    types,
    isLoading,
    error,
    refetch: fetchTypes,
  };
}

/**
 * Hook for integration mutations (connect, update, sync, disconnect)
 */
export function useIntegrationMutations() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // Set up token getter
  useEffect(() => {
    api.setTokenGetter(() => getToken());
  }, [getToken]);

  const connectIntegration = async (
    input: ConnectIntegrationInput
  ): Promise<{
    id: string;
    type: string;
    name: string;
    status: string;
    evidenceGenerated: number;
    controlsVerified: number;
    message: string;
  }> => {
    setIsLoading(true);
    try {
      return await api.post('/integrations', input);
    } finally {
      setIsLoading(false);
    }
  };

  const updateIntegration = async (
    id: string,
    input: UpdateIntegrationInput
  ): Promise<IntegrationListItem> => {
    setIsLoading(true);
    try {
      return await api.patch(`/integrations/${id}`, input);
    } finally {
      setIsLoading(false);
    }
  };

  const triggerSync = async (id: string): Promise<SyncResult> => {
    setIsLoading(true);
    try {
      return await api.post(`/integrations/${id}/sync`);
    } finally {
      setIsLoading(false);
    }
  };

  const testConnection = async (id: string): Promise<TestConnectionResult> => {
    setIsLoading(true);
    try {
      return await api.post(`/integrations/${id}/test`);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectIntegration = async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      await api.delete(`/integrations/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    connectIntegration,
    updateIntegration,
    triggerSync,
    testConnection,
    disconnectIntegration,
    isLoading,
  };
}
