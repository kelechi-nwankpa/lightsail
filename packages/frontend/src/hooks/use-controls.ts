import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../lib/api';
import type {
  ControlListItem,
  ControlDetail,
  ControlFilters,
  CreateControlInput,
  UpdateControlInput,
  FrameworkMapping,
} from '../types/controls';

export function useControls(initialFilters: ControlFilters = {}) {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [controls, setControls] = useState<ControlListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<ControlFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Set up token getter
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchControls = useCallback(async () => {
    // Don't fetch if not authenticated or no org
    if (!isLoaded || !isSignedIn || !orgId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.ownerId) params.set('ownerId', filters.ownerId);
      if (filters.frameworkId) params.set('frameworkId', filters.frameworkId);
      if (filters.riskLevel) params.set('riskLevel', filters.riskLevel);
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

      const queryString = params.toString();
      const endpoint = `/controls${queryString ? `?${queryString}` : ''}`;

      const response = await api.getWithPagination<ControlListItem[]>(endpoint);

      // Client-side filtering for hasEvidence (until backend supports it)
      let filteredData = response.data;
      if (filters.hasEvidence !== undefined) {
        filteredData = response.data.filter(control => {
          const hasEvidence = control.evidenceCount > 0;
          return filters.hasEvidence ? hasEvidence : !hasEvidence;
        });
      }

      setControls(filteredData);
      if (response.pagination) {
        // Adjust pagination for client-side filtering
        if (filters.hasEvidence !== undefined) {
          setPagination({
            ...response.pagination,
            total: filteredData.length,
            totalPages: Math.ceil(filteredData.length / response.pagination.pageSize) || 1,
          });
        } else {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      console.error('Failed to fetch controls:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch controls'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoaded, isSignedIn, orgId]);

  useEffect(() => {
    fetchControls();
  }, [fetchControls]);

  const updateFilters = useCallback((newFilters: Partial<ControlFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return {
    controls,
    pagination,
    filters,
    isLoading,
    error,
    refetch: fetchControls,
    updateFilters,
    setPage,
  };
}

export function useControl(id: string | null) {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [control, setControl] = useState<ControlDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchControl = useCallback(async () => {
    if (!id || !isLoaded || !isSignedIn || !orgId) {
      setControl(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<ControlDetail>(`/controls/${id}`);
      setControl(data);
    } catch (err) {
      console.error('Failed to fetch control:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch control'));
    } finally {
      setIsLoading(false);
    }
  }, [id, isLoaded, isSignedIn, orgId]);

  useEffect(() => {
    fetchControl();
  }, [fetchControl]);

  return { control, isLoading, error, refetch: fetchControl };
}

export function useControlMutations() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.setTokenGetter(() => getToken());
  }, [getToken]);

  const createControl = async (input: CreateControlInput) => {
    setIsLoading(true);
    try {
      const data = await api.post<ControlListItem>('/controls', input);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const updateControl = async (id: string, input: UpdateControlInput) => {
    setIsLoading(true);
    try {
      const data = await api.patch<ControlListItem>(`/controls/${id}`, input);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteControl = async (id: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/controls/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const addMapping = async (
    controlId: string,
    requirementId: string,
    coverage: 'full' | 'partial' | 'minimal' = 'full',
    notes?: string
  ) => {
    setIsLoading(true);
    try {
      const data = await api.post<FrameworkMapping>(`/controls/${controlId}/mappings`, {
        requirementId,
        coverage,
        notes,
      });
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const removeMapping = async (controlId: string, mappingId: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/controls/${controlId}/mappings/${mappingId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createControl,
    updateControl,
    deleteControl,
    addMapping,
    removeMapping,
    isLoading,
  };
}
