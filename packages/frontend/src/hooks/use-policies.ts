import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../lib/api';
import type {
  PolicyListItem,
  PolicyDetail,
  PolicyFilters,
  CreatePolicyInput,
  UpdatePolicyInput,
} from '../types/policies';

export function usePolicies(initialFilters: PolicyFilters = {}) {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [policies, setPolicies] = useState<PolicyListItem[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<PolicyFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchPolicies = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !orgId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filters.status) params.set('status', filters.status);
      if (filters.category) params.set('category', filters.category);
      if (filters.search) params.set('search', filters.search);
      if (filters.page) params.set('page', String(filters.page));
      if (filters.pageSize) params.set('pageSize', String(filters.pageSize));

      const queryString = params.toString();
      const endpoint = `/policies${queryString ? `?${queryString}` : ''}`;

      const response = await api.getWithPagination<PolicyListItem[]>(endpoint);
      setPolicies(response.data);
      if (response.pagination) {
        setPagination(response.pagination);
      }
    } catch (err) {
      console.error('Failed to fetch policies:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch policies'));
    } finally {
      setIsLoading(false);
    }
  }, [filters, isLoaded, isSignedIn, orgId]);

  useEffect(() => {
    fetchPolicies();
  }, [fetchPolicies]);

  const updateFilters = useCallback((newFilters: Partial<PolicyFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters((prev) => ({ ...prev, page }));
  }, []);

  return {
    policies,
    pagination,
    filters,
    isLoading,
    error,
    refetch: fetchPolicies,
    updateFilters,
    setPage,
  };
}

export function usePolicy(id: string | null) {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [policy, setPolicy] = useState<PolicyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchPolicy = useCallback(async () => {
    if (!id || !isLoaded || !isSignedIn || !orgId) {
      setPolicy(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<PolicyDetail>(`/policies/${id}`);
      setPolicy(data);
    } catch (err) {
      console.error('Failed to fetch policy:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch policy'));
    } finally {
      setIsLoading(false);
    }
  }, [id, isLoaded, isSignedIn, orgId]);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  return { policy, isLoading, error, refetch: fetchPolicy };
}

export function usePolicyCategories() {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    const fetchCategories = async () => {
      if (!isLoaded || !isSignedIn || !orgId) {
        setIsLoading(false);
        return;
      }

      try {
        const data = await api.get<string[]>('/policies/categories');
        setCategories(data);
      } catch (err) {
        console.error('Failed to fetch policy categories:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [isLoaded, isSignedIn, orgId]);

  return { categories, isLoading };
}

export function usePolicyMutations() {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    api.setTokenGetter(() => getToken());
  }, [getToken]);

  const createPolicy = async (input: CreatePolicyInput) => {
    setIsLoading(true);
    try {
      const data = await api.post<PolicyListItem>('/policies', input);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const updatePolicy = async (id: string, input: UpdatePolicyInput) => {
    setIsLoading(true);
    try {
      const data = await api.patch<PolicyListItem>(`/policies/${id}`, input);
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const deletePolicy = async (id: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/policies/${id}`);
    } finally {
      setIsLoading(false);
    }
  };

  const submitForReview = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.post<{ id: string; status: string }>(`/policies/${id}/submit`, {});
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const approvePolicy = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.post<{ id: string; status: string; approvedAt: string }>(`/policies/${id}/approve`, {});
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const archivePolicy = async (id: string) => {
    setIsLoading(true);
    try {
      const data = await api.post<{ id: string; status: string }>(`/policies/${id}/archive`, {});
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const linkControl = async (policyId: string, controlId: string) => {
    setIsLoading(true);
    try {
      const data = await api.post(`/policies/${policyId}/controls`, { controlId });
      return data;
    } finally {
      setIsLoading(false);
    }
  };

  const unlinkControl = async (policyId: string, controlId: string) => {
    setIsLoading(true);
    try {
      await api.delete(`/policies/${policyId}/controls/${controlId}`);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    createPolicy,
    updatePolicy,
    deletePolicy,
    submitForReview,
    approvePolicy,
    archivePolicy,
    linkControl,
    unlinkControl,
    isLoading,
  };
}
