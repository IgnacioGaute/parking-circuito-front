import { Bike, Car } from 'lucide-react';
import type { FieldDefinition, VehicleType } from '@/types';

export function VehicleIcon({ tipo, size = 18 }: { tipo: VehicleType; size?: number }) {
  return tipo === 'auto' ? (
    <Car size={size} strokeWidth={2} />
  ) : (
    <Bike size={size} strokeWidth={2} />
  );
}

export function formatExtraValue(value: unknown, field?: FieldDefinition): string {
  if (value === undefined || value === null || value === '') return '—';
  if (field?.type === 'boolean') return value === true ? 'Sí' : 'No';
  return String(value);
}
