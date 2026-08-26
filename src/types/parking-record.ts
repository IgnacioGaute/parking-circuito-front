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
  createdAt: string;
}

export interface CreateEntradaPayload {
  placa: string;
  tipo: VehicleType;
  fotoUrl?: string;
  extraFields?: Record<string, unknown>;
}

export interface HistoryFilters {
  placa?: string;
  tipo?: VehicleType;
}

export interface FrequentPlate {
  placa: string;
  tipo: VehicleType;
  lastEntradaTime: string;
  extraFields: Record<string, unknown> | null;
  visitCount: number;
}
