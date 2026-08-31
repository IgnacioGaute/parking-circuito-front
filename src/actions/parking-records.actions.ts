'use server';

import { getAuthToken } from '@/lib/get-auth-token';
import {
  cancelRecordRequest,
  createEntradaRequest,
  fetchFrequentRequest,
  fetchHistoryRequest,
  fetchInsideRequest,
  registerSalidaRequest,
  reopenRecordRequest,
  updateRecordRequest,
} from '@/services/parking-records.service';
import type {
  CancelRecordPayload,
  CreateEntradaPayload,
  FrequentPlate,
  HistoryFilters,
  ParkingRecord,
  UpdateRecordPayload,
} from '@/types';

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

export async function getFrequentAction(): Promise<FrequentPlate[]> {
  const token = await getAuthToken();
  return fetchFrequentRequest(token);
}

export async function registerSalidaAction(id: string): Promise<ParkingRecord> {
  const token = await getAuthToken();
  return registerSalidaRequest(id, token);
}

export async function updateRecordAction(
  id: string,
  payload: UpdateRecordPayload,
): Promise<ParkingRecord> {
  const token = await getAuthToken();
  return updateRecordRequest(id, payload, token);
}

export async function cancelRecordAction(
  id: string,
  payload: CancelRecordPayload,
): Promise<ParkingRecord> {
  const token = await getAuthToken();
  return cancelRecordRequest(id, payload, token);
}

export async function reopenRecordAction(id: string): Promise<ParkingRecord> {
  const token = await getAuthToken();
  return reopenRecordRequest(id, token);
}
