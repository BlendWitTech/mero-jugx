import api from './api';
import { useAuthStore } from '../store/authStore';

export interface LoginCredentials {
  email: string;
  password: string;
  organization_id?: string;
}

export interface RegisterOrganizationData {
  name: string;
  email: string;
  owner_email: string;
  owner_password: string;
  owner_first_name: string;
  owner_last_name: string;
  is_existing_user?: boolean;
  package_id?: number;
}

export interface LoginResponse {
  access_token?: string;
  refresh_token?: string;
  user?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
  organization?: {
    id: string;
    name?: string;
    slug?: string;
  };
  requires_mfa_verification?: boolean;
  temp_token?: string;
  requires_mfa_setup?: boolean;
  temp_setup_token?: string;
  requires_organization_selection?: boolean;
  organizations?: Array<{
    id: string;
    name: string;
    slug: string;
    role: string;
  }>;
  message?: string;
}

export const authService = {
  async registerOrganization(data: RegisterOrganizationData) {
    const response = await api.post('/auth/organization/register', data);
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const url = credentials.organization_id
      ? `/auth/login?organization_id=${credentials.organization_id}`
      : '/auth/login';
    try {
      const response = await api.post(url, {
        email: credentials.email,
        password: credentials.password,
      });
      return response.data;
    } catch (error: any) {
      // If the error response contains MFA setup requirement, return it as success
      if (error.response?.data?.requires_mfa_setup || error.response?.data?.temp_setup_token) {
        return error.response.data;
      }
      throw error;
    }
  },

  async verifyMfa(tempToken: string, code: string) {
    const response = await api.post('/auth/verify-mfa', {
      temp_token: tempToken,
      code,
    });
    return response.data;
  },

  async refreshToken(refreshToken: string) {
    const response = await api.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },

  async logout() {
    const token = useAuthStore.getState().accessToken;
    if (token) {
      await api.post('/auth/logout', { token });
    }
    useAuthStore.getState().logout();
  },

  async verifyEmail(token: string) {
    const response = await api.get(`/auth/verify-email?token=${token}`);
    return response.data;
  },

  async forgotPassword(email: string) {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(token: string, newPassword: string) {
    const response = await api.post('/auth/reset-password', {
      token,
      new_password: newPassword,
    });
    return response.data;
  },
};

