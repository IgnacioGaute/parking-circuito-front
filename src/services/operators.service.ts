import 'server-only';
import type { CreateOperatorPayload, Operator, UpdateOperatorPayload } from '@/types';
import { apiFetch } from './api-client';

export function fetchOperators(): Promise<Operator[]> {
  return apiFetch<Operator[]>('/operators');
}

export function createOperatorRequest(
  payload: CreateOperatorPayload,
  token: string,
): Promise<Operator> {
  return apiFetch<Operator>('/operators', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function updateOperatorRequest(
  id: string,
  payload: UpdateOperatorPayload,
  token: string,
): Promise<Operator> {
  return apiFetch<Operator>(`/operators/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteOperatorRequest(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/operators/${id}`, {
    method: 'DELETE',
    token,
  });
}
