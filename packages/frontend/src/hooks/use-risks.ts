import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../lib/api';
import type {
  RiskListItem,
  RiskDetail,
  RiskFilters,
  CreateRiskInput,
  UpdateRiskInput,
  LinkControlInput,
} from '../types/risks';

const DEFAULT_FILTERS: RiskFilters = {
  page: 1,
  pageSize: 20,
};

export function useRisks(initialFilters: RiskFilters = {}) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [risks, setRisks] = useState<RiskListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<RiskFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchRisks = useCallback(async () => {
    if (!isLoaded || !isSignedIn) return;

    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await api.getWithPagination<RiskListItem[]>(`/risks?${params}`);
      setRisks(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch risks'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, filters]);

  useEffect(() => {
    fetchRisks();
  }, [fetchRisks]);

  const updateFilters = useCallback((newFilters: Partial<RiskFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      page: newFilters.page ?? 1, // Reset to page 1 when filters change
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return {
    risks,
    pagination,
    filters,
    isLoading,
    error,
    refetch: fetchRisks,
    updateFilters,
    setPage,
  };
}

export function useRisk(id: string | null) {
  const { isLoaded, isSignedIn, getToken } = useAuth();
  const [risk, setRisk] = useState<RiskDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchRisk = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !id) {
      setRisk(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await api.get<RiskDetail>(`/risks/${id}`);
      setRisk(response);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch risk'));
      setRisk(null);
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, id]);

  useEffect(() => {
    fetchRisk();
  }, [fetchRisk]);

  return {
    risk,
    isLoading,
    error,
    refetch: fetchRisk,
  };
}

export function useRiskMutations() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.setTokenGetter(() => getToken());
  }, [getToken]);

  const createRisk = useCallback(async (input: CreateRiskInput): Promise<RiskListItem> => {
    setIsLoading(true);
    try {
      const response = await api.post<RiskListItem>('/risks', input);
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRisk = useCallback(async (id: string, input: UpdateRiskInput): Promise<RiskListItem> => {
    setIsLoading(true);
    try {
      const response = await api.patch<RiskListItem>(`/risks/${id}`, input);
      return response;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRisk = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    try {
      await api.delete(`/risks/${id}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const linkControl = useCallback(async (riskId: string, input: LinkControlInput): Promise<void> => {
    setIsLoading(true);
    try {
      await api.post(`/risks/${riskId}/controls`, input);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const unlinkControl = useCallback(async (riskId: string, controlId: string): Promise<void> => {
    setIsLoading(true);
    try {
      await api.delete(`/risks/${riskId}/controls/${controlId}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createRisk,
    updateRisk,
    deleteRisk,
    linkControl,
    unlinkControl,
    isLoading,
  };
}
