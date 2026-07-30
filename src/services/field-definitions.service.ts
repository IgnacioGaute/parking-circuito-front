import 'server-only';
import type {
  CreateFieldDefinitionPayload,
  FieldDefinition,
  UpdateFieldDefinitionPayload,
} from '@/types';
import { apiFetch } from './api-client';

export function fetchFieldDefinitions(token: string): Promise<FieldDefinition[]> {
  return apiFetch<FieldDefinition[]>('/field-definitions', { token });
}

export function fetchActiveFieldDefinitions(token: string): Promise<FieldDefinition[]> {
  return apiFetch<FieldDefinition[]>('/field-definitions/active', { token });
}

export function createFieldDefinitionRequest(
  payload: CreateFieldDefinitionPayload,
  token: string,
): Promise<FieldDefinition> {
  return apiFetch<FieldDefinition>('/field-definitions', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function updateFieldDefinitionRequest(
  id: string,
  payload: UpdateFieldDefinitionPayload,
  token: string,
): Promise<FieldDefinition> {
  return apiFetch<FieldDefinition>(`/field-definitions/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}

export function deleteFieldDefinitionRequest(id: string, token: string): Promise<void> {
  return apiFetch<void>(`/field-definitions/${id}`, {
    method: 'DELETE',
    token,
  });
}
