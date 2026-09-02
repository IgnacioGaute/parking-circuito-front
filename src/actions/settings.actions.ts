'use server';

import { getAuthToken } from '@/lib/get-auth-token';
import { fetchSettings, updateSettingsRequest } from '@/services/settings.service';
import type { AppSettings, UpdateSettingsPayload } from '@/types';

export async function getSettingsAction(): Promise<AppSettings> {
  const token = await getAuthToken();
  return fetchSettings(token);
}

export async function updateSettingsAction(
  payload: UpdateSettingsPayload,
): Promise<AppSettings> {
  const token = await getAuthToken();
  return updateSettingsRequest(payload, token);
}
