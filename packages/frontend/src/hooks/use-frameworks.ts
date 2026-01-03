import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { api } from '../lib/api';
import type {
  FrameworkListItem,
  FrameworkDetail,
  EnabledFramework,
  FrameworkRequirementNode,
} from '../types/controls';

export function useFrameworks() {
  const [frameworks, setFrameworks] = useState<FrameworkListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchFrameworks = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<FrameworkListItem[]>('/frameworks');
      setFrameworks(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch frameworks'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFrameworks();
  }, [fetchFrameworks]);

  return { frameworks, isLoading, error, refetch: fetchFrameworks };
}

export function useFramework(id: string | null) {
  const [framework, setFramework] = useState<FrameworkDetail | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchFramework = useCallback(async () => {
    if (!id) {
      setFramework(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<FrameworkDetail>(`/frameworks/${id}`);
      setFramework(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch framework'));
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchFramework();
  }, [fetchFramework]);

  return { framework, isLoading, error, refetch: fetchFramework };
}

export function useFrameworkRequirements(frameworkId: string | null) {
  const [requirements, setRequirements] = useState<FrameworkRequirementNode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRequirements = useCallback(async () => {
    if (!frameworkId) {
      setRequirements([]);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<FrameworkRequirementNode[]>(
        `/frameworks/${frameworkId}/requirements`
      );
      setRequirements(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch requirements'));
    } finally {
      setIsLoading(false);
    }
  }, [frameworkId]);

  useEffect(() => {
    fetchRequirements();
  }, [fetchRequirements]);

  return { requirements, isLoading, error, refetch: fetchRequirements };
}

export function useEnabledFrameworks() {
  const { isLoaded, isSignedIn, getToken, orgId } = useAuth();

  const [enabledFrameworks, setEnabledFrameworks] = useState<EnabledFramework[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Set up token getter
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      api.setTokenGetter(() => getToken());
    }
  }, [isLoaded, isSignedIn, getToken]);

  const fetchEnabledFrameworks = useCallback(async () => {
    // Don't fetch if not authenticated or no org
    if (!isLoaded || !isSignedIn || !orgId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const data = await api.get<EnabledFramework[]>('/frameworks/enabled');
      setEnabledFrameworks(data);
    } catch (err) {
      console.error('Failed to fetch enabled frameworks:', err);
      setError(err instanceof Error ? err : new Error('Failed to fetch enabled frameworks'));
    } finally {
      setIsLoading(false);
    }
  }, [isLoaded, isSignedIn, orgId]);

  useEffect(() => {
    fetchEnabledFrameworks();
  }, [fetchEnabledFrameworks]);

  const enableFramework = async (frameworkId: string) => {
    try {
      const result = await api.post<{
        id: string;
        frameworkId: string;
        frameworkName: string;
        controlsCreated: number;
        controlsSkipped: number;
        mappingsCreated: number;
        message: string;
      }>('/frameworks/enable', { frameworkId });
      await fetchEnabledFrameworks();
      return result;
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to enable framework');
    }
  };

  const disableFramework = async (frameworkId: string) => {
    try {
      await api.post('/frameworks/disable', { frameworkId });
      await fetchEnabledFrameworks();
    } catch (err) {
      throw err instanceof Error ? err : new Error('Failed to disable framework');
    }
  };

  return { enabledFrameworks, isLoading, error, refetch: fetchEnabledFrameworks, enableFramework, disableFramework };
}
