// Realistic sample data for the Estadísticas dashboard, shaped exactly like
// the real domain (ParkingRecord/Operator — see src/types). There is no
// revenue/payment concept anywhere in this system (checked parking-records
// entity + service on the backend): everything the dashboard can honestly
// show comes from entry/exit timestamps, vehicle type, operator and
// cancellations, so that's what gets modeled here. Generation is seeded
// (mulberry32) so the same session always sees the same "history" instead
// of reshuffling on every render.
import type { Operator, ParkingRecord, VehicleType } from '@/types';

const DAY_MS = 86_400_000;
const HISTORY_DAYS = 90;

function mulberry32(seed: number) {
  let a = seed;
  return function random() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(20260214);
const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)];

export const MOCK_OPERATORS: Operator[] = [
  { id: 'op-1', name: 'Marcos Díaz', initials: 'MD', role: 'admin', onDuty: true },
  { id: 'op-2', name: 'Rocío Fernández', initials: 'RF', role: 'user', onDuty: true },
  { id: 'op-3', name: 'Julián Torres', initials: 'JT', role: 'user', onDuty: false },
  { id: 'op-4', name: 'Sofía Ibarra', initials: 'SI', role: 'user', onDuty: false },
];

const PLATE_LETTERS = 'ABCDEFGHJKLMNPRSTUVWXYZ';
function randomPlaca(): string {
  const letters = () =>
    Array.from({ length: 3 }, () => PLATE_LETTERS[Math.floor(rand() * PLATE_LETTERS.length)]).join('');
  const digits = () => String(Math.floor(rand() * 900) + 100);
  return `${letters()} ${digits()}`;
}

// Hour-of-day traffic weight — two commute peaks (morning/evening) plus a
// smaller lunch bump, near-zero overnight. Index = hour 0-23.
const HOURLY_WEIGHTS = [
  1, 1, 1, 1, 1, 2, 5, 12, 22, 18, 12, 10, 14, 16, 11, 9, 10, 16, 22, 17, 10, 6, 3, 2,
];
const WEEKEND_HOURLY_WEIGHTS = [
  2, 2, 1, 1, 1, 1, 2, 3, 6, 10, 14, 16, 17, 16, 14, 13, 12, 11, 9, 7, 5, 4, 3, 2,
];

function weightedHour(weights: number[]): number {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let h = 0; h < weights.length; h++) {
    r -= weights[h];
    if (r <= 0) return h;
  }
  return 12;
}

// A small pool of plates re-visits often (the "frecuentes" of this dataset);
// the rest are one-off entries. Weighted so the pool itself skews toward a
// handful of very frequent plates rather than all visiting equally.
const FREQUENT_POOL = Array.from({ length: 26 }, randomPlaca);
const FREQUENT_WEIGHTS = FREQUENT_POOL.map((_, i) => Math.max(1, 30 - i * 1.1));

function pickPlaca(): string {
  // ~55% of entries are a repeat visit from the frequent pool.
  if (rand() < 0.55) {
    const total = FREQUENT_WEIGHTS.reduce((a, b) => a + b, 0);
    let r = rand() * total;
    for (let i = 0; i < FREQUENT_POOL.length; i++) {
      r -= FREQUENT_WEIGHTS[i];
      if (r <= 0) return FREQUENT_POOL[i];
    }
  }
  return randomPlaca();
}

function durationMinutes(tipo: VehicleType, hour: number): number {
  // Motos tend to be quick errands; autos skew toward long "workday" stays
  // during business hours and short stops otherwise.
  const isBusinessHour = hour >= 8 && hour <= 19;
  const base = tipo === 'moto' ? 25 : isBusinessHour ? 140 : 45;
  const spread = tipo === 'moto' ? 40 : isBusinessHour ? 220 : 90;
  return Math.max(4, Math.round(base + (rand() - 0.35) * spread));
}

let generated: ParkingRecord[] | null = null;

export function getMockParkingRecords(): ParkingRecord[] {
  if (generated) return generated;

  const now = new Date();
  const records: ParkingRecord[] = [];
  let seq = 0;

  for (let dayOffset = HISTORY_DAYS - 1; dayOffset >= 0; dayOffset--) {
    const day = new Date(now.getTime() - dayOffset * DAY_MS);
    const isWeekend = day.getDay() === 0 || day.getDay() === 6;
    const weights = isWeekend ? WEEKEND_HOURLY_WEIGHTS : HOURLY_WEIGHTS;
    const ticketsToday = Math.round((isWeekend ? 26 : 48) + rand() * (isWeekend ? 14 : 20));

    for (let i = 0; i < ticketsToday; i++) {
      const hour = weightedHour(weights);
      const minute = Math.floor(rand() * 60);
      const entrada = new Date(day);
      entrada.setHours(hour, minute, Math.floor(rand() * 60), 0);
      if (entrada > now) continue;

      const tipo: VehicleType = rand() < 0.72 ? 'auto' : 'moto';
      const placa = pickPlaca();
      const cancelled = rand() < 0.025;
      const stillInside = !cancelled && dayOffset === 0 && rand() < 0.08 && entrada.getTime() > now.getTime() - 4 * 3600_000;

      const operadorEntrada = pick(MOCK_OPERATORS);
      let salida: Date | null = null;
      let operadorSalida: Operator | null = null;
      if (!cancelled && !stillInside) {
        const mins = durationMinutes(tipo, hour);
        salida = new Date(entrada.getTime() + mins * 60_000);
        if (salida > now) salida = new Date(now.getTime() - Math.floor(rand() * 5) * 60_000);
        operadorSalida = rand() < 0.7 ? operadorEntrada : pick(MOCK_OPERATORS);
      }

      seq += 1;
      records.push({
        id: `mock-${seq}`,
        placa,
        tipo,
        entradaTime: entrada.toISOString(),
        salidaTime: salida ? salida.toISOString() : null,
        fotoUrl: null,
        extraFields: null,
        operadorEntrada,
        operadorSalida,
        editedAt: null,
        editedBy: null,
        cancelled,
        cancelledAt: cancelled ? entrada.toISOString() : null,
        cancelledBy: cancelled ? pick(MOCK_OPERATORS) : null,
        cancelReason: cancelled ? pick(['Carga duplicada', 'Error de placa', 'Prueba del sistema']) : null,
        createdAt: entrada.toISOString(),
      });
    }
  }

  records.sort((a, b) => new Date(a.entradaTime).getTime() - new Date(b.entradaTime).getTime());
  generated = records;
  return records;
}

// ---------------------------------------------------------------------------
// Filters
// ---------------------------------------------------------------------------

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

// Cancellations are shown as their own rate, so they're pulled with the same
// scope filters but without the "not cancelled" gate `applyFilters` applies.
export function applyScopeIncludingCancelled(
  records: ParkingRecord[],
  filters: AnalyticsFilters,
): ParkingRecord[] {
  return records.filter((record) => {
    const key = toDateKey(new Date(record.entradaTime));
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

export function cancellationRate(scopedIncludingCancelled: ParkingRecord[]): number {
  if (scopedIncludingCancelled.length === 0) return 0;
  const cancelled = scopedIncludingCancelled.filter((r) => r.cancelled).length;
  return cancelled / scopedIncludingCancelled.length;
}

export function currentlyInside(records: ParkingRecord[]): number {
  return records.filter((r) => !r.cancelled && !r.salidaTime).length;
}
