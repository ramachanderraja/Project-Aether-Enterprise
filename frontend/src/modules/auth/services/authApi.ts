import { apiClient } from '@/shared/services/api/apiClient';

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: {
    id: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
    tenant_id: string;
  };
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar_url?: string;
  roles: string[];
  permissions: string[];
  tenant: {
    id: string;
    name: string;
    plan: string;
  };
  preferences: {
    theme: string;
    locale: string;
    timezone: string;
    default_currency: string;
  };
  last_login: string;
}

export const authApi = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  refresh: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await apiClient.post<{ access_token: string }>('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refresh_token: refreshToken });
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
