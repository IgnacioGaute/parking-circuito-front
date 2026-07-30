'use server';

import { getAuthToken } from '@/lib/get-auth-token';
import {
  createFieldDefinitionRequest,
  deleteFieldDefinitionRequest,
  fetchActiveFieldDefinitions,
  fetchFieldDefinitions,
  updateFieldDefinitionRequest,
} from '@/services/field-definitions.service';
import type {
  CreateFieldDefinitionPayload,
  FieldDefinition,
  UpdateFieldDefinitionPayload,
} from '@/types';

export async function getFieldDefinitionsAction(): Promise<FieldDefinition[]> {
  const token = await getAuthToken();
  return fetchFieldDefinitions(token);
}

export async function getActiveFieldDefinitionsAction(): Promise<FieldDefinition[]> {
  const token = await getAuthToken();
  return fetchActiveFieldDefinitions(token);
}

export async function createFieldDefinitionAction(
  payload: CreateFieldDefinitionPayload,
): Promise<FieldDefinition> {
  const token = await getAuthToken();
  return createFieldDefinitionRequest(payload, token);
}

export async function updateFieldDefinitionAction(
  id: string,
  payload: UpdateFieldDefinitionPayload,
): Promise<FieldDefinition> {
  const token = await getAuthToken();
  return updateFieldDefinitionRequest(id, payload, token);
}

export async function deleteFieldDefinitionAction(id: string): Promise<void> {
  const token = await getAuthToken();
  return deleteFieldDefinitionRequest(id, token);
}
