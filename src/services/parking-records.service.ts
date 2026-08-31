import 'server-only';
import type {
  CancelRecordPayload,
  CreateEntradaPayload,
  FrequentPlate,
  HistoryFilters,
  ParkingRecord,
  UpdateRecordPayload,
} from '@/types';
import { apiFetch } from './api-client';

export function createEntradaRequest(
  payload: CreateEntradaPayload,
  token: string,
): Promise<ParkingRecord> {
  return apiFetch<ParkingRecord>('/parking-records', {
    method: 'POST',
    body: JSON.stringify(payload),
    token,
  });
}

export function fetchInsideRequest(
  token: string,
  placa?: string,
): Promise<ParkingRecord[]> {
  const query = placa ? `?placa=${encodeURIComponent(placa)}` : '';
  return apiFetch<ParkingRecord[]>(`/parking-records/inside${query}`, {
    token,
  });
}

export function fetchHistoryRequest(
  token: string,
  filters: HistoryFilters,
): Promise<ParkingRecord[]> {
  const params = new URLSearchParams();
  if (filters.placa) params.set('placa', filters.placa);
  if (filters.tipo) params.set('tipo', filters.tipo);
  const query = params.size > 0 ? `?${params.toString()}` : '';
  return apiFetch<ParkingRecord[]>(`/parking-records/history${query}`, {
    token,
  });
}

export function fetchFrequentRequest(token: string): Promise<FrequentPlate[]> {
  return apiFetch<FrequentPlate[]>('/parking-records/frequent', { token });
}

export function registerSalidaRequest(
  id: string,
  token: string,
): Promise<ParkingRecord> {
  return apiFetch<ParkingRecord>(`/parking-records/${id}/exit`, {
    method: 'PATCH',
    token,
  });
}

export function updateRecordRequest(
  id: string,
  payload: UpdateRecordPayload,
  token: string,
): Promise<ParkingRecord> {
  return apiFetch<ParkingRecord>(`/parking-records/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}

export function cancelRecordRequest(
  id: string,
  payload: CancelRecordPayload,
  token: string,
): Promise<ParkingRecord> {
  return apiFetch<ParkingRecord>(`/parking-records/${id}/cancel`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
    token,
  });
}

export function reopenRecordRequest(id: string, token: string): Promise<ParkingRecord> {
  return apiFetch<ParkingRecord>(`/parking-records/${id}/reopen`, {
    method: 'PATCH',
    token,
  });
}
