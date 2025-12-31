const API_URL = import.meta.env.VITE_API_URL || '/api/v1';

interface ApiResponse<T> {
  success: true;
  data: T;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Array<{ field: string; message: string }>;
  };
}

type ApiResult<T> = ApiResponse<T> | ApiError;

class ApiClient {
  private baseUrl: string;
  private getToken: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  setTokenGetter(getter: () => Promise<string | null>) {
    this.getToken = getter;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add auth token if available
    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    const data: ApiResult<T> = await response.json();

    if (!data.success) {
      throw new ApiRequestError(data.error.message, data.error.code, data.error.details);
    }

    return data.data;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async patch<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  // Get full response including pagination
  async getWithPagination<T>(endpoint: string): Promise<{ data: T; pagination: ApiResponse<T>['pagination'] }> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.getToken) {
      const token = await this.getToken();
      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'include',
    });

    const result = await response.json();

    if (!result.success) {
      throw new ApiRequestError(result.error.message, result.error.code, result.error.details);
    }

    return { data: result.data, pagination: result.pagination };
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: Array<{ field: string; message: string }>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const api = new ApiClient(API_URL);
