import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../lib/api';
import type {
  EvidenceListItem,
  EvidenceDetail,
  EvidenceFilters,
  CreateEvidenceInput,
  UpdateEvidenceInput,
  ReviewEvidenceInput,
  LinkControlInput,
} from '../types/evidence';

export function useEvidence(initialFilters: EvidenceFilters = {}) {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [evidence, setEvidence] = useState<EvidenceListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<EvidenceFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Set up token getter
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchEvidence = useCallback(async () => {
    // Don't fetch if not authenticated or no org
    if (!isLoaded || !isSignedIn || !orgId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.controlId) params.set('controlId', filters.controlId);
      if (filters.type) params.set('type', filters.type);
      if (filters.source) params.set('source', filters.source);
      if (filters.reviewStatus) params.set('reviewStatus', filters.reviewStatus);
      if (filters.validOnly !== undefined) params.set('validOnly', String(filters.validOnly));
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

      const queryString = params.toString();
      const endpoint = `/evidence${queryString ? `?${queryString}` : ''}`;

      const response = await api.getWithPagination<EvidenceListItem[]>(endpoint);

      setEvidence(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch evidence:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch evidence'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoaded, isSignedIn, orgId]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  const updateFilters = useCallback((newFilters: Partial<EvidenceFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return {
    evidence,
    pagination,
    filters,
    isLoading,
    error,
    refetch: fetchEvidence,
    updateFilters,
    setPage,
  };
}

export function useEvidenceDetail(id: string | null) {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [evidence, setEvidence] = useState<EvidenceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchEvidence = useCallback(async () => {
    if (!id || !isLoaded || !isSignedIn || !orgId) {
      setEvidence(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<EvidenceDetail>(`/evidence/${id}`);
      setEvidence(data);
    } catch (err) {
      console.error('Failed to fetch evidence detail:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch evidence'));
    } finally {
      setIsLoading(false);
    }
  }, [id, isLoaded, isSignedIn, orgId]);

  useEffect(() => {
    fetchEvidence();
  }, [fetchEvidence]);

  return { evidence, isLoading, error, refetch: fetchEvidence };
}

export function useEvidenceMutations() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.setTokenGetter(() => getToken());
  }, [getToken]);

  const createEvidence = async (input: CreateEvidenceInput) => {
    setIsLoading(true);
    try {
      const data = await api.post<EvidenceListItem>('/evidence', input);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const updateEvidence = async (id: string, input: UpdateEvidenceInput) => {
    setIsLoading(true);
    try {
      const data = await api.patch<EvidenceListItem>(`/evidence/${id}`, input);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteEvidence = async (id: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/evidence/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const reviewEvidence = async (id: string, input: ReviewEvidenceInput) => {
    setIsLoading(true);
    try {
      const data = await api.post<{ reviewStatus: string; reviewedAt: string }>(`/evidence/${id}/review`, input);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const linkControl = async (evidenceId: string, input: LinkControlInput) => {
    setIsLoading(true);
    try {
      const data = await api.post(`/evidence/${evidenceId}/controls`, input);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const unlinkControl = async (evidenceId: string, controlId: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/evidence/${evidenceId}/controls/${controlId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createEvidence,
    updateEvidence,
    deleteEvidence,
    reviewEvidence,
    linkControl,
    unlinkControl,
    isLoading,
  };
}
