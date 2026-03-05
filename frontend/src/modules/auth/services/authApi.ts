import axios from 'axios';
import { apiClient } from '@/shared/services/api/apiClient';

const BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

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
  // Use plain axios for login/refresh to avoid the apiClient 401 interceptor
  // which would redirect to /login on invalid credentials instead of showing an error
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email,
      password,
    });
    // Backend wraps in { success, data, meta } envelope
    return response.data?.data ?? response.data;
  },

  refresh: async (refreshToken: string): Promise<{ access_token: string }> => {
    const response = await axios.post(`${BASE_URL}/auth/refresh`, {
      refresh_token: refreshToken,
    });
    return response.data?.data ?? response.data;
  },

  logout: async (refreshToken?: string): Promise<void> => {
    await apiClient.post('/auth/logout', { refresh_token: refreshToken });
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },
};
