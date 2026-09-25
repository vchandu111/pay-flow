import { apiClient } from '../../services/apiClient';
import type { Profile } from '../auth/types';

export interface UpdateProfilePayload {
  name?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export async function updateProfileRequest(payload: UpdateProfilePayload): Promise<Profile> {
  const res = await apiClient.patch<{ user: Profile }>('/users/me', payload);
  return res.data.user;
}

export async function changePasswordRequest(payload: ChangePasswordPayload): Promise<void> {
  await apiClient.post('/users/me/password', payload);
}
