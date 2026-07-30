'use server';

import { getAuthToken } from '@/lib/get-auth-token';
import {
  createEntradaRequest,
  fetchHistoryRequest,
  fetchInsideRequest,
  registerSalidaRequest,
} from '@/services/parking-records.service';
import type { CreateEntradaPayload, HistoryFilters, ParkingRecord } from '@/types';

export async function createEntradaAction(
  payload: CreateEntradaPayload,
): Promise<ParkingRecord> {
  const token = await getAuthToken();
  return createEntradaRequest(payload, token);
}

export async function getInsideAction(placa?: string): Promise<ParkingRecord[]> {
  const token = await getAuthToken();
  return fetchInsideRequest(token, placa);
}

export async function getHistoryAction(
  filters: HistoryFilters,
): Promise<ParkingRecord[]> {
  const token = await getAuthToken();
  return fetchHistoryRequest(token, filters);
}

export async function registerSalidaAction(id: string): Promise<ParkingRecord> {
  const token = await getAuthToken();
  return registerSalidaRequest(id, token);
}
