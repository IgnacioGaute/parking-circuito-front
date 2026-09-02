// Pure filter/aggregation helpers for the Estadísticas dashboard. These take
// real ParkingRecord[]/Operator[] data (see src/actions/parking-records.actions.ts,
// src/actions/operators.actions.ts) — there is no revenue/payment concept
// anywhere in this system, so everything here is derived from entry/exit
// timestamps, vehicle type and operator only.
import type { Operator, ParkingRecord, VehicleType } from '@/types';

const DAY_MS = 86_400_000;

export type RangePreset = 'hoy' | '7d' | '30d' | '90d' | 'custom';

export interface AnalyticsFilters {
  preset: RangePreset;
  from: string; // yyyy-mm-dd, inclusive
  to: string; // yyyy-mm-dd, inclusive
  tipo: VehicleType | 'todos';
  operatorId: string | 'todos';
}

function toDateKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function presetRange(preset: RangePreset): { from: string; to: string } {
  const today = new Date();
  const to = toDateKey(today);
  if (preset === 'hoy') return { from: to, to };
  const days = preset === '7d' ? 6 : preset === '30d' ? 29 : 89;
  const from = toDateKey(new Date(today.getTime() - days * DAY_MS));
  return { from, to };
}

function referenceTime(record: ParkingRecord): string {
  return record.salidaTime ?? record.entradaTime;
}

export function applyFilters(records: ParkingRecord[], filters: AnalyticsFilters): ParkingRecord[] {
  return records.filter((record) => {
    if (record.cancelled) return false;
    const key = toDateKey(new Date(referenceTime(record)));
    if (filters.from && key < filters.from) return false;
    if (filters.to && key > filters.to) return false;
    if (filters.tipo !== 'todos' && record.tipo !== filters.tipo) return false;
    if (filters.operatorId !== 'todos' && record.operadorEntrada.id !== filters.operatorId) return false;
    return true;
  });
}

// ---------------------------------------------------------------------------
// Aggregations
// ---------------------------------------------------------------------------

export interface HourBucket {
  hour: number;
  entradas: number;
  salidas: number;
}

export function byHour(records: ParkingRecord[]): HourBucket[] {
  const buckets: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({ hour, entradas: 0, salidas: 0 }));
  for (const record of records) {
    buckets[new Date(record.entradaTime).getHours()].entradas += 1;
    if (record.salidaTime) buckets[new Date(record.salidaTime).getHours()].salidas += 1;
  }
  return buckets;
}

export interface DayBucket {
  key: string;
  label: string;
  total: number;
}

export function byDay(records: ParkingRecord[], from: string, to: string): DayBucket[] {
  const map = new Map<string, number>();
  for (const record of records) {
    const key = toDateKey(new Date(record.entradaTime));
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  const [fy, fm, fd] = from.split('-').map(Number);
  const [ty, tm, td] = to.split('-').map(Number);
  const start = new Date(fy, fm - 1, fd);
  const end = new Date(ty, tm - 1, td);
  const out: DayBucket[] = [];
  for (let d = new Date(start); d <= end; d = new Date(d.getTime() + DAY_MS)) {
    const key = toDateKey(d);
    out.push({
      key,
      label: d.toLocaleDateString('es', { day: '2-digit', month: 'short' }),
      total: map.get(key) ?? 0,
    });
  }
  return out;
}

export interface VehicleMix {
  tipo: VehicleType;
  count: number;
}

export function byVehicleType(records: ParkingRecord[]): VehicleMix[] {
  const auto = records.filter((r) => r.tipo === 'auto').length;
  const moto = records.length - auto;
  return [
    { tipo: 'auto', count: auto },
    { tipo: 'moto', count: moto },
  ];
}

export interface OperatorActivity {
  operator: Operator;
  count: number;
}

export function byOperator(records: ParkingRecord[]): OperatorActivity[] {
  const map = new Map<string, OperatorActivity>();
  for (const record of records) {
    const existing = map.get(record.operadorEntrada.id);
    if (existing) existing.count += 1;
    else map.set(record.operadorEntrada.id, { operator: record.operadorEntrada, count: 1 });
  }
  return [...map.values()].sort((a, b) => b.count - a.count);
}

export interface FrequentPlateStat {
  placa: string;
  visits: number;
}

export function topFrequentPlates(records: ParkingRecord[], limit = 8): FrequentPlateStat[] {
  const map = new Map<string, number>();
  for (const record of records) map.set(record.placa, (map.get(record.placa) ?? 0) + 1);
  return [...map.entries()]
    .map(([placa, visits]) => ({ placa, visits }))
    .filter((p) => p.visits > 1)
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit);
}

export function averageStayMinutes(records: ParkingRecord[]): number {
  const closed = records.filter((r) => r.salidaTime);
  if (closed.length === 0) return 0;
  const totalMs = closed.reduce(
    (sum, r) => sum + (new Date(r.salidaTime!).getTime() - new Date(r.entradaTime).getTime()),
    0,
  );
  return Math.round(totalMs / closed.length / 60000);
}

export function currentlyInside(records: ParkingRecord[]): number {
  return records.filter((r) => !r.cancelled && !r.salidaTime).length;
}
