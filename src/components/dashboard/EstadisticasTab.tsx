'use client';

import gsap from 'gsap';
import { CalendarClock, Car, Percent, Timer } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { colors, fonts } from '@/styles/theme';
import type { VehicleType } from '@/types';
import {
  applyFilters,
  applyScopeIncludingCancelled,
  averageStayMinutes,
  byDay,
  byHour,
  byOperator,
  byVehicleType,
  cancellationRate,
  currentlyInside,
  getMockParkingRecords,
  MOCK_OPERATORS,
  presetRange,
  topFrequentPlates,
  type AnalyticsFilters,
  type RangePreset,
} from '@/lib/analytics-mock';
import { tipoLabel } from '@/lib/format';
import { ChartCard } from './charts/ChartCard';
import { formatMinutes, prefersReducedMotion } from './charts/chart-utils';
import { DonutChart } from './charts/DonutChart';
import { MultiLineChart } from './charts/MultiLineChart';
import { RankedBarChart } from './charts/RankedBarChart';
import { StatTile } from './charts/StatTile';

const PRESETS: { key: RangePreset; label: string }[] = [
  { key: 'hoy', label: 'Hoy' },
  { key: '7d', label: '7 días' },
  { key: '30d', label: '30 días' },
  { key: '90d', label: '90 días' },
  { key: 'custom', label: 'Personalizado' },
];

const pillStyle = (active: boolean): React.CSSProperties => ({
  border: `1px solid ${active ? colors.accent : colors.border}`,
  background: active ? colors.accentBgSoft : colors.bgInput,
  color: active ? colors.accent : colors.textPrimary,
  cursor: 'pointer',
  padding: '9px 14px',
  borderRadius: 999,
  font: 'inherit',
  fontWeight: 700,
  fontSize: 12.5,
  whiteSpace: 'nowrap',
});

const selectStyle: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  background: colors.bgInput,
  borderRadius: 12,
  padding: '9px 32px 9px 13px',
  font: 'inherit',
  fontSize: 13,
  fontWeight: 600,
  color: colors.textPrimary,
  cursor: 'pointer',
  appearance: 'none',
};

const dateInputStyle: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  background: colors.bgInput,
  borderRadius: 10,
  padding: '8px 11px',
  font: 'inherit',
  fontSize: 13,
  color: colors.textPrimary,
};

export function EstadisticasTab() {
  const [preset, setPreset] = useState<RangePreset>('30d');
  const [customFrom, setCustomFrom] = useState(() => presetRange('30d').from);
  const [customTo, setCustomTo] = useState(() => presetRange('30d').to);
  const [tipo, setTipo] = useState<VehicleType | 'todos'>('todos');
  const [operatorId, setOperatorId] = useState<string>('todos');

  const records = useMemo(() => getMockParkingRecords(), []);

  const range = preset === 'custom' ? { from: customFrom, to: customTo } : presetRange(preset);
  const filters: AnalyticsFilters = useMemo(
    () => ({ preset, from: range.from, to: range.to, tipo, operatorId }),
    [preset, range.from, range.to, tipo, operatorId],
  );

  const scoped = useMemo(() => applyFilters(records, filters), [records, filters]);
  const scopedWithCancelled = useMemo(
    () => applyScopeIncludingCancelled(records, filters),
    [records, filters],
  );

  const insideNow = useMemo(
    () => currentlyInside(tipo === 'todos' ? records : records.filter((r) => r.tipo === tipo)),
    [records, tipo],
  );

  const dayBuckets = useMemo(() => byDay(scoped, filters.from, filters.to), [scoped, filters.from, filters.to]);
  const hourBuckets = useMemo(() => byHour(scoped), [scoped]);
  const vehicleMix = useMemo(() => byVehicleType(scoped), [scoped]);
  const operatorActivity = useMemo(() => byOperator(scoped), [scoped]);
  const topPlates = useMemo(() => topFrequentPlates(scoped, 8), [scoped]);
  const avgStay = useMemo(() => averageStayMinutes(scoped), [scoped]);
  const cancelRate = useMemo(() => cancellationRate(scopedWithCancelled), [scopedWithCancelled]);

  const dayLabelEvery = dayBuckets.length <= 10 ? 1 : dayBuckets.length <= 31 ? 3 : dayBuckets.length <= 60 ? 7 : 10;

  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;
    const items = el.querySelectorAll<HTMLElement>('.stats-kpi, .stats-chart-card');
    gsap.fromTo(
      items,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.55, ease: 'power3.out', stagger: 0.06 },
    );
  }, []);

  return (
    <div ref={containerRef} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Estadísticas</div>

      <div data-tour="estadisticas-filtros" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {PRESETS.map((p) => (
            <button key={p.key} onClick={() => setPreset(p.key)} style={pillStyle(preset === p.key)}>
              {p.label}
            </button>
          ))}

          <span style={{ width: 1, height: 22, background: colors.border, margin: '0 2px' }} />

          <div style={{ position: 'relative' }}>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as VehicleType | 'todos')} style={selectStyle}>
              <option value="todos">Todos los vehículos</option>
              <option value="auto">Auto</option>
              <option value="moto">Moto</option>
            </select>
          </div>

          <div style={{ position: 'relative' }}>
            <select value={operatorId} onChange={(e) => setOperatorId(e.target.value)} style={selectStyle}>
              <option value="todos">Todos los operadores</option>
              {MOCK_OPERATORS.map((op) => (
                <option key={op.id} value={op.id}>
                  {op.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {preset === 'custom' && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <label style={{ fontSize: 11.5, color: colors.textMuted, fontWeight: 600 }}>
              Desde{' '}
              <input
                type="date"
                value={customFrom}
                max={customTo}
                onChange={(e) => setCustomFrom(e.target.value)}
                style={{ ...dateInputStyle, marginLeft: 6 }}
              />
            </label>
            <label style={{ fontSize: 11.5, color: colors.textMuted, fontWeight: 600 }}>
              Hasta{' '}
              <input
                type="date"
                value={customTo}
                min={customFrom}
                onChange={(e) => setCustomTo(e.target.value)}
                style={{ ...dateInputStyle, marginLeft: 6 }}
              />
            </label>
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 12,
        }}
      >
        <div className="stats-kpi">
          <StatTile label="Tickets en el rango" value={scoped.length} format={(n) => n.toLocaleString('es')} Icon={CalendarClock} hint={rangeHint(filters)} />
        </div>
        <div className="stats-kpi">
          <StatTile label="Dentro ahora mismo" value={insideNow} format={(n) => n.toLocaleString('es')} Icon={Car} hint="en este momento" />
        </div>
        <div className="stats-kpi">
          <StatTile label="Estadía promedio" value={avgStay} format={formatMinutes} Icon={Timer} hint="visitas cerradas en el rango" />
        </div>
        <div className="stats-kpi">
          <StatTile
            label="Tasa de cancelación"
            value={Math.round(cancelRate * 1000)}
            format={(n) => `${(n / 10).toFixed(1)}%`}
            Icon={Percent}
            hint="del total registrado"
          />
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: 16,
        }}
      >
        <ChartCard
          title="Tendencia diaria"
          subtitle="Tickets registrados por día en el rango seleccionado"
          span={2}
          tableHeaders={['Fecha', 'Tickets']}
          tableRows={dayBuckets.map((d) => [d.label, d.total])}
        >
          <MultiLineChart
            ariaLabel="Tickets por día"
            categories={dayBuckets.map((d) => d.label)}
            series={[{ key: 'total', label: 'Tickets', color: colors.accent, values: dayBuckets.map((d) => d.total) }]}
            labelEvery={dayLabelEvery}
          />
        </ChartCard>

        <ChartCard
          title="Actividad por hora"
          subtitle="Entradas y salidas agregadas por franja horaria"
          span={2}
          tableHeaders={['Hora', 'Entradas', 'Salidas']}
          tableRows={hourBuckets.map((h) => [`${h.hour}h`, h.entradas, h.salidas])}
        >
          <MultiLineChart
            ariaLabel="Actividad por hora del día"
            categories={hourBuckets.map((h) => `${h.hour}h`)}
            series={[
              { key: 'entradas', label: 'Entradas', color: colors.accent, values: hourBuckets.map((h) => h.entradas) },
              { key: 'salidas', label: 'Salidas', color: colors.green, values: hourBuckets.map((h) => h.salidas) },
            ]}
            labelEvery={3}
          />
        </ChartCard>

        <ChartCard
          title="Mezcla de vehículos"
          subtitle="Auto vs. moto en el rango"
          tableHeaders={['Tipo', 'Tickets', '%']}
          tableRows={vehicleMix.map((m) => [
            tipoLabel(m.tipo),
            m.count,
            `${scoped.length ? Math.round((m.count / scoped.length) * 100) : 0}%`,
          ])}
        >
          <DonutChart
            ariaLabel="Mezcla de tipos de vehículo"
            centerLabel="tickets"
            slices={vehicleMix.map((m) => ({
              key: m.tipo,
              label: tipoLabel(m.tipo),
              value: m.count,
              color: m.tipo === 'auto' ? colors.accent : colors.green,
            }))}
          />
        </ChartCard>

        <ChartCard
          title="Patentes más frecuentes"
          subtitle="Placas con más de una visita en el rango"
          tableHeaders={['Patente', 'Visitas']}
          tableRows={topPlates.map((p) => [p.placa, p.visits])}
        >
          <RankedBarChart
            ariaLabel="Patentes más frecuentes"
            rows={topPlates.map((p) => ({ key: p.placa, label: p.placa, value: p.visits }))}
            valueFormat={(n) => `${n} vis.`}
            emptyMessage="Sin patentes recurrentes en este rango."
          />
        </ChartCard>

        <ChartCard
          title="Actividad por operador"
          subtitle="Entradas registradas por cada operador"
          span={2}
          tableHeaders={['Operador', 'Tickets registrados']}
          tableRows={operatorActivity.map((o) => [o.operator.name, o.count])}
        >
          <RankedBarChart
            ariaLabel="Actividad por operador"
            rows={operatorActivity.map((o) => ({ key: o.operator.id, label: o.operator.name, value: o.count }))}
            emptyMessage="Sin registros en este rango."
            monospaceLabels={false}
          />
        </ChartCard>
      </div>

      <div style={{ fontSize: 10.5, color: colors.textDim, fontFamily: fonts.mono }}>
        Datos de ejemplo con fines demostrativos.
      </div>
    </div>
  );
}

function rangeHint(filters: AnalyticsFilters): string {
  if (filters.preset === 'hoy') return 'hoy';
  if (filters.preset === '7d') return 'últimos 7 días';
  if (filters.preset === '30d') return 'últimos 30 días';
  if (filters.preset === '90d') return 'últimos 90 días';
  return `${filters.from} → ${filters.to}`;
}
