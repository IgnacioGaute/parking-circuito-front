import type { Operator } from './operator';

export type VehicleType = 'auto' | 'moto';

export interface ParkingRecord {
  id: string;
  placa: string;
  tipo: VehicleType;
  entradaTime: string;
  salidaTime: string | null;
  fotoUrl: string | null;
  extraFields: Record<string, unknown> | null;
  operadorEntrada: Operator;
  operadorSalida: Operator | null;
  editedAt: string | null;
  editedBy: Operator | null;
  cancelled: boolean;
  cancelledAt: string | null;
  cancelledBy: Operator | null;
  cancelReason: string | null;
  createdAt: string;
}

export interface CreateEntradaPayload {
  placa: string;
  tipo: VehicleType;
  fotoUrl?: string;
  extraFields?: Record<string, unknown>;
  markedFrequent?: boolean;
}

export interface UpdateRecordPayload {
  placa?: string;
  tipo?: VehicleType;
  extraFields?: Record<string, unknown>;
}

export interface CancelRecordPayload {
  reason?: string;
}

export interface HistoryFilters {
  placa?: string;
  tipo?: VehicleType;
}

export interface FrequentPlate {
  id: string;
  placa: string;
  tipo: VehicleType;
  lastEntradaTime: string;
  extraFields: Record<string, unknown> | null;
  visitCount: number;
}
