import 'server-only';
import type { AppSettings, UpdateSettingsPayload } from '@/types';
import { apiFetch } from './api-client';

export function fetchSettings(token: string): Promise<AppSettings> {
  return apiFetch<AppSettings>('/settings', { token });
}

export function updateSettingsRequest(
  payload: UpdateSettingsPayload,
  token: string,
): Promise<AppSettings> {
  return apiFetch<AppSettings>('/settings', {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}
