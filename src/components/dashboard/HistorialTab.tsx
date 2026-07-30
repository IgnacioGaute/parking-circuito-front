'use client';

import { Bike, Car, ChevronDown, Search, SlidersHorizontal, X } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getHistoryAction } from '@/actions/parking-records.actions';
import {
  dateKey,
  formatDate,
  formatDateHeading,
  formatDuration,
  formatTime,
  timeKey,
  tipoColors,
  tipoLabel,
} from '@/lib/format';
import { colors, fonts } from '@/styles/theme';
import type { ParkingRecord, VehicleType } from '@/types';

const PAGE_SIZE = 8;

function VehicleIcon({ tipo, size = 18 }: { tipo: 'auto' | 'moto'; size?: number }) {
  return tipo === 'auto' ? (
    <Car size={size} strokeWidth={1.8} />
  ) : (
    <Bike size={size} strokeWidth={1.8} />
  );
}

// Records don't carry a plain "date" — a completed visit is dated by its
// exit, an in-progress one (shouldn't normally reach /history, but just in
// case) by its entry.
function referenceTime(record: ParkingRecord): string {
  return record.salidaTime ?? record.entradaTime;
}

export function HistorialTab() {
  const [query, setQuery] = useState('');
  const [tipoFilter, setTipoFilter] = useState<VehicleType | 'todos'>('todos');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [timeFrom, setTimeFrom] = useState('');
  const [timeTo, setTimeTo] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  useEffect(() => {
    let cancelled = false;
    const timeout = setTimeout(() => {
      setLoading(true);
      getHistoryAction({
        placa: query || undefined,
        tipo: tipoFilter === 'todos' ? undefined : tipoFilter,
      })
        .then((result) => {
          if (!cancelled) setRecords(result);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, tipoFilter]);

  // New filters narrow down what's already on screen, so there's no need to
  // round-trip to the backend for them — reset pagination whenever any
  // filter changes so the list doesn't open mid-scroll on stale content.
  // (Reset happens during render, React's documented pattern for this,
  // rather than in an effect, to avoid an extra cascading render.)
  const filterSignature = `${query}|${tipoFilter}|${dateFrom}|${dateTo}|${timeFrom}|${timeTo}`;
  const [prevFilterSignature, setPrevFilterSignature] = useState(filterSignature);
  if (filterSignature !== prevFilterSignature) {
    setPrevFilterSignature(filterSignature);
    setVisibleCount(PAGE_SIZE);
  }

  const filteredRecords = useMemo(() => {
    return records
      .filter((record) => {
        const ref = referenceTime(record);
        if (dateFrom && dateKey(ref) < dateFrom) return false;
        if (dateTo && dateKey(ref) > dateTo) return false;
        if (timeFrom || timeTo) {
          const t = timeKey(ref);
          const from = timeFrom || '00:00';
          const to = timeTo || '23:59';
          // "from" after "to" means an overnight window (e.g. 22:00–06:00).
          const inRange = from <= to ? t >= from && t <= to : t >= from || t <= to;
          if (!inRange) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(referenceTime(b)).getTime() - new Date(referenceTime(a)).getTime());
  }, [records, dateFrom, dateTo, timeFrom, timeTo]);

  const visibleRecords = filteredRecords.slice(0, visibleCount);
  const remaining = filteredRecords.length - visibleRecords.length;

  const groups = useMemo(() => {
    const map = new Map<string, ParkingRecord[]>();
    for (const record of visibleRecords) {
      const key = dateKey(referenceTime(record));
      const group = map.get(key);
      if (group) group.push(record);
      else map.set(key, [record]);
    }
    return [...map.entries()];
  }, [visibleRecords]);

  const activeTimeFilters = [dateFrom, dateTo, timeFrom, timeTo].filter(Boolean).length;
  const clearTimeFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTimeFrom('');
    setTimeTo('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp .3s both' }}>
      <div
        style={{
          fontFamily: fonts.display,
          fontSize: 22,
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.03em',
        }}
      >
        Historial
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 2, minWidth: 160 }}>
          <Search
            size={16}
            strokeWidth={1.8}
            style={{
              position: 'absolute',
              left: 13,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textDimmer,
              pointerEvents: 'none',
            }}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="BUSCAR POR PLACA…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: `1.5px solid ${colors.border}`,
              background: colors.bgCard,
              borderRadius: 10,
              padding: '12px 14px 12px 38px',
              font: 'inherit',
              fontSize: 14,
              letterSpacing: '0.03em',
              outline: 'none',
              color: colors.textPrimary,
            }}
          />
        </div>
        <div style={{ position: 'relative', flex: 1, minWidth: 150 }}>
          <select
            value={tipoFilter}
            onChange={(event) => setTipoFilter(event.target.value as VehicleType | 'todos')}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              appearance: 'none',
              border: `1.5px solid ${colors.border}`,
              background: colors.bgCard,
              borderRadius: 10,
              padding: '12px 36px 12px 14px',
              font: 'inherit',
              fontSize: 14,
              fontWeight: 600,
              color: colors.textPrimary,
              cursor: 'pointer',
            }}
          >
            <option value="todos">Todos los tipos</option>
            <option value="auto">Auto</option>
            <option value="moto">Moto</option>
          </select>
          <ChevronDown
            size={16}
            strokeWidth={2}
            style={{
              position: 'absolute',
              right: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textMuted,
              pointerEvents: 'none',
            }}
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          style={{
            position: 'relative',
            flexShrink: 0,
            width: 46,
            border: `1.5px solid ${activeTimeFilters > 0 ? colors.accent : colors.border}`,
            background: colors.bgCard,
            color: activeTimeFilters > 0 ? colors.accentText : colors.textPrimary,
            cursor: 'pointer',
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Filtrar por fecha y horario"
          title="Filtrar por fecha y horario"
        >
          <SlidersHorizontal size={17} strokeWidth={1.8} />
          {activeTimeFilters > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -5,
                right: -5,
                width: 17,
                height: 17,
                borderRadius: '50%',
                background: colors.accent,
                color: colors.accentContrast,
                fontSize: 10,
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {activeTimeFilters}
            </span>
          )}
        </button>
      </div>

      {!loading && filteredRecords.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 16px',
            color: colors.textDimmer,
            fontSize: 14,
            border: `1px dashed ${colors.border}`,
            borderRadius: 10,
          }}
        >
          Sin registros que coincidan.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {groups.map(([key, groupRecords]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                background: colors.bg,
                padding: '6px 2px',
                display: 'flex',
                alignItems: 'baseline',
                gap: 8,
              }}
            >
              <span
                style={{
                  fontFamily: fonts.display,
                  fontSize: 13,
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: colors.textMuted,
                }}
              >
                {formatDateHeading(key)}
              </span>
              <span style={{ fontSize: 11.5, color: colors.textDimmer }}>
                {groupRecords.length} {groupRecords.length === 1 ? 'registro' : 'registros'}
              </span>
            </div>

            {groupRecords.map((record) => {
              const typeColors = tipoColors(record.tipo);
              return (
                <div
                  key={record.id}
                  style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <span
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 9,
                      background: typeColors.bg,
                      color: typeColors.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <VehicleIcon tipo={record.tipo} size={16} />
                  </span>
                  <div style={{ minWidth: 110 }}>
                    <div
                      style={{
                        display: 'inline-block',
                        background: colors.plateBg,
                        color: colors.plateText,
                        borderRadius: 6,
                        padding: '2px 8px',
                        fontFamily: fonts.display,
                        fontWeight: 800,
                        fontSize: 16,
                        letterSpacing: '0.05em',
                      }}
                    >
                      {record.placa}
                    </div>
                    <div
                      style={{
                        fontSize: 10.5,
                        color: colors.textDim,
                        marginTop: 5,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {tipoLabel(record.tipo)} · {record.salidaTime ? formatDate(record.salidaTime) : ''}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 150, display: 'flex', gap: 20 }}>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: colors.textDimmer,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        Entrada
                      </div>
                      <div style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 700 }}>
                        {formatTime(record.entradaTime)}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: colors.textDimmer,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        Salida
                      </div>
                      <div style={{ fontFamily: fonts.display, fontSize: 15, fontWeight: 700 }}>
                        {record.salidaTime ? formatTime(record.salidaTime) : '—'}
                      </div>
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          color: colors.textDimmer,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                        }}
                      >
                        Duración
                      </div>
                      <div
                        style={{
                          fontFamily: fonts.display,
                          fontSize: 15,
                          fontWeight: 700,
                          color: colors.accentText,
                        }}
                      >
                        {record.salidaTime
                          ? formatDuration(
                              new Date(record.salidaTime).getTime() - new Date(record.entradaTime).getTime(),
                            )
                          : '—'}
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: colors.textDimmer,
                      whiteSpace: 'nowrap',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {record.operadorEntrada.name} → {record.operadorSalida?.name ?? '—'}
                  </div>
                </div>
              );
            })}
          </div>
        ))}

        {remaining > 0 && (
          <button
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            style={{
              border: `1.5px dashed ${colors.border}`,
              background: 'transparent',
              color: colors.textMuted,
              cursor: 'pointer',
              padding: '13px 18px',
              borderRadius: 12,
              font: 'inherit',
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 13,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Cargar {Math.min(remaining, PAGE_SIZE)} más ({remaining} restantes)
          </button>
        )}
      </div>

      {showFilters && (
        <DateTimeFiltersSheet
          dateFrom={dateFrom}
          dateTo={dateTo}
          timeFrom={timeFrom}
          timeTo={timeTo}
          onDateFromChange={setDateFrom}
          onDateToChange={setDateTo}
          onTimeFromChange={setTimeFrom}
          onTimeToChange={setTimeTo}
          onClear={clearTimeFilters}
          onClose={() => setShowFilters(false)}
        />
      )}
    </div>
  );
}

interface DateTimeFiltersSheetProps {
  dateFrom: string;
  dateTo: string;
  timeFrom: string;
  timeTo: string;
  onDateFromChange: (value: string) => void;
  onDateToChange: (value: string) => void;
  onTimeFromChange: (value: string) => void;
  onTimeToChange: (value: string) => void;
  onClear: () => void;
  onClose: () => void;
}

const fieldLabelStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: colors.textDimmer,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  marginBottom: 6,
  display: 'block',
};

const dateTimeInputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: `1.5px solid ${colors.border}`,
  background: colors.bgInput,
  borderRadius: 10,
  padding: '11px 12px',
  font: 'inherit',
  fontSize: 14,
  color: colors.textPrimary,
  outline: 'none',
};

function DateTimeFiltersSheet({
  dateFrom,
  dateTo,
  timeFrom,
  timeTo,
  onDateFromChange,
  onDateToChange,
  onTimeFromChange,
  onTimeToChange,
  onClear,
  onClose,
}: DateTimeFiltersSheetProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return createPortal(
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 699,
          background: 'rgba(8,9,11,0.55)',
          animation: 'backdropIn .2s ease-out both',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 700,
          background: colors.bg,
          borderRadius: '24px 24px 0 0',
          boxShadow: `0 -20px 50px ${colors.shadow}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'sheetUp .32s cubic-bezier(.16,1,.3,1) both',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, flexShrink: 0 }}>
          <span style={{ width: 36, height: 4, borderRadius: 999, background: colors.border }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontFamily: fonts.display,
              fontWeight: 800,
              fontSize: 19,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            Filtrar historial
          </div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 34,
              height: 34,
              border: `1.5px solid ${colors.border}`,
              borderRadius: 10,
              background: 'transparent',
              color: colors.textMuted,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>

        <div
          style={{
            padding: '4px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div>
            <div style={{ ...fieldLabelStyle, marginBottom: 8 }}>Rango de fechas</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabelStyle} htmlFor="historial-fecha-desde">
                  Desde
                </label>
                <input
                  id="historial-fecha-desde"
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(event) => onDateFromChange(event.target.value)}
                  style={dateTimeInputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabelStyle} htmlFor="historial-fecha-hasta">
                  Hasta
                </label>
                <input
                  id="historial-fecha-hasta"
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(event) => onDateToChange(event.target.value)}
                  style={dateTimeInputStyle}
                />
              </div>
            </div>
          </div>

          <div>
            <div style={{ ...fieldLabelStyle, marginBottom: 8 }}>Horario (opcional)</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={fieldLabelStyle} htmlFor="historial-hora-desde">
                  Desde
                </label>
                <input
                  id="historial-hora-desde"
                  type="time"
                  value={timeFrom}
                  onChange={(event) => onTimeFromChange(event.target.value)}
                  style={dateTimeInputStyle}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={fieldLabelStyle} htmlFor="historial-hora-hasta">
                  Hasta
                </label>
                <input
                  id="historial-hora-hasta"
                  type="time"
                  value={timeTo}
                  onChange={(event) => onTimeToChange(event.target.value)}
                  style={dateTimeInputStyle}
                />
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: colors.textDimmer, marginTop: 8 }}>
              Filtra por la hora del día, sin importar la fecha. Si &quot;Desde&quot; es mayor
              que &quot;Hasta&quot;, se interpreta como un rango que cruza la medianoche.
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            flexShrink: 0,
            borderTop: `1px solid ${colors.border}`,
            padding: '14px 20px calc(14px + env(safe-area-inset-bottom))',
          }}
        >
          <button
            onClick={onClear}
            style={{
              flex: 1,
              border: `1.5px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textMuted,
              cursor: 'pointer',
              padding: 15,
              borderRadius: 14,
              font: 'inherit',
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Limpiar
          </button>
          <button
            onClick={onClose}
            style={{
              flex: 2,
              border: 'none',
              background: colors.accent,
              color: colors.accentContrast,
              cursor: 'pointer',
              padding: 15,
              borderRadius: 14,
              font: 'inherit',
              fontFamily: fonts.display,
              fontWeight: 800,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            Aplicar
          </button>
        </div>
      </div>
    </>,
    document.body,
  );
}
