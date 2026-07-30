import 'server-only';
import type { LoginPayload, LoginResult } from '@/types';
import { apiFetch } from './api-client';

export function loginRequest(payload: LoginPayload): Promise<LoginResult> {
  return apiFetch<LoginResult>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function logoutRequest(token: string): Promise<void> {
  return apiFetch<void>('/auth/logout', {
    method: 'POST',
    token,
  });
}
