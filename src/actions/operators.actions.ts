'use server';

import { getAuthToken } from '@/lib/get-auth-token';
import {
  createOperatorRequest,
  deleteOperatorRequest,
  fetchOperators,
  updateOperatorRequest,
} from '@/services/operators.service';
import type { CreateOperatorPayload, Operator, UpdateOperatorPayload } from '@/types';

export async function getOperatorsAction(): Promise<Operator[]> {
  return fetchOperators();
}

export async function createOperatorAction(
  payload: CreateOperatorPayload,
): Promise<Operator> {
  const token = await getAuthToken();
  return createOperatorRequest(payload, token);
}

export async function updateOperatorAction(
  id: string,
  payload: UpdateOperatorPayload,
): Promise<Operator> {
  const token = await getAuthToken();
  return updateOperatorRequest(id, payload, token);
}

export async function deleteOperatorAction(id: string): Promise<void> {
  const token = await getAuthToken();
  return deleteOperatorRequest(id, token);
}
