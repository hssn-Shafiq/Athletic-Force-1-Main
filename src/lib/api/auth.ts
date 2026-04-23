import { apiClient } from './client';
import {
  AuthResponse,
  LoginRequest,
  LogoutResponse,
  RefreshResponse,
  RegisterRequest,
  UpdateProfileRequest,
  UpdatePasswordRequest,
} from './types';
import { env } from '../env';

export async function registerApi(payload: RegisterRequest) {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/register', payload);
  return data;
}

export async function loginApi(payload: LoginRequest) {
  const { data } = await apiClient.post<AuthResponse>('/api/auth/login', payload);
  return data;
}

export async function meApi() {
  const { data } = await apiClient.get<AuthResponse>('/api/auth/me');
  return data;
}

export async function updateProfileApi(payload: UpdateProfileRequest) {
  const { data } = await apiClient.put<AuthResponse>('/api/auth/profile', payload);
  return data;
}

export async function updatePasswordApi(payload: UpdatePasswordRequest) {
  const { data } = await apiClient.put<{ ok: boolean }>('/api/auth/password', payload);
  return data;
}

export async function refreshApi() {
  const { data } = await apiClient.post<RefreshResponse>('/api/auth/refresh', {});
  return data;
}

export async function logoutApi() {
  const { data } = await apiClient.post<LogoutResponse>('/api/auth/logout', {});
  return data;
}

export function getGoogleAuthUrl() {
  return `${env.apiBaseUrl}/api/auth/google`;
}
