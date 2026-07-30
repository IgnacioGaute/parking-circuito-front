import 'server-only';
import type {
  CreateEntradaPayload,
  HistoryFilters,
  ParkingRecord,
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

export function registerSalidaRequest(
  id: string,
  token: string,
): Promise<ParkingRecord> {
  return apiFetch<ParkingRecord>(`/parking-records/${id}/exit`, {
    method: 'PATCH',
    token,
  });
}
