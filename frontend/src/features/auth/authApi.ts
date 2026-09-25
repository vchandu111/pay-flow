import { apiClient } from '../../services/apiClient';
import type { Profile } from './types';

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerRequest(payload: RegisterPayload): Promise<{ user: Profile }> {
  const res = await apiClient.post<{ user: Profile }>('/auth/register', payload);
  return res.data;
}

export async function loginRequest(payload: LoginPayload): Promise<{ user: Profile }> {
  const res = await apiClient.post<{ user: Profile }>('/auth/login', payload);
  return res.data;
}

export async function logoutRequest(): Promise<void> {
  await apiClient.post('/auth/logout');
}

export async function getMeRequest(): Promise<{ user: Profile }> {
  const res = await apiClient.get<{ user: Profile }>('/users/me');
  return res.data;
}
