'use client';

import {
  Calendar,
  Clock as ClockIcon,
  FileDown,
  Pencil,
  SlidersHorizontal,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import jsPDF from 'jspdf';
import { autoTable } from 'jspdf-autotable';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getFieldDefinitionsAction } from '@/actions/field-definitions.actions';
import {
  cancelRecordAction,
  getHistoryAction,
  reopenRecordAction,
} from '@/actions/parking-records.actions';
import { LoadingSquares } from '@/components/ui/LoadingSquares';
import { SearchField } from '@/components/ui/SearchField';
import { SelectField } from '@/components/ui/SelectField';
import { readActiveOperator } from '@/lib/active-operator';
import {
  dateKey,
  formatDateHeading,
  formatDuration,
  formatTime,
  timeKey,
  tipoLabel,
} from '@/lib/format';
import { useStaggerReveal } from '@/lib/use-stagger-reveal';
import { colors, fonts } from '@/styles/theme';
import type { FieldDefinition, ParkingRecord, VehicleType } from '@/types';
import { ConfirmActionSheet } from './ConfirmActionSheet';
import { EditRecordModal } from './EditRecordModal';
import { formatExtraValue, VehicleIcon } from './record-display-utils';

const PAGE_SIZE = 8;

const iconButtonStyle: React.CSSProperties = {
  width: 30,
  height: 30,
  border: `1px solid ${colors.border}`,
  background: 'transparent',
  color: colors.textMuted,
  cursor: 'pointer',
  borderRadius: 8,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

// Records don't carry a plain "date" — a completed visit is dated by its
// exit, an in-progress one (shouldn't normally reach /history, but just in
// case) by its entry.
function referenceTime(record: ParkingRecord): string {
  return record.salidaTime ?? record.entradaTime;
}

// All field definitions, not just active ones: a record can carry data for a
// field that was later deactivated, and it still needs a label to show it.
function getExtraEntries(record: ParkingRecord, customFields: FieldDefinition[]) {
  const extraFields = record.extraFields ?? {};
  return customFields
    .map((field) => ({ field, value: extraFields[field.key] }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '');
}

interface HistorialTabProps {
  isAdmin: boolean;
  onToast: (message: string) => void;
}

export function HistorialTab({ isAdmin, onToast }: HistorialTabProps) {
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
  const [customFields, setCustomFields] = useState<FieldDefinition[]>([]);
  const [editingRecord, setEditingRecord] = useState<ParkingRecord | null>(null);
  const [cancelingRecord, setCancelingRecord] = useState<ParkingRecord | null>(null);
  const [cancelBusy, setCancelBusy] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reopeningRecord, setReopeningRecord] = useState<ParkingRecord | null>(null);
  const [reopenBusy, setReopenBusy] = useState(false);
  const [reopenError, setReopenError] = useState<string | null>(null);

  useEffect(() => {
    getFieldDefinitionsAction()
      .then((result) =>
        setCustomFields(
          result.filter((f) => f.key !== 'placa' && f.key !== 'tipo' && f.key !== 'foto'),
        ),
      )
      .catch(() => undefined);
  }, []);

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
  const listRef = useStaggerReveal<HTMLDivElement>(
    '.historial-record',
    visibleRecords.map((r) => r.id).join(','),
  );

  // Independent from `groups`/pagination: a day's PDF always includes every
  // record for that date under the current search/type filters, even if not
  // all of them have been scrolled into view yet via "Cargar más".
  const downloadDayPdf = (key: string) => {
    const dayRecords = filteredRecords
      .filter((record) => dateKey(referenceTime(record)) === key)
      .sort((a, b) => new Date(a.entradaTime).getTime() - new Date(b.entradaTime).getTime());
    if (dayRecords.length === 0) return;

    const operator = readActiveOperator();
    const [y, m, d] = key.split('-').map(Number);
    const longDate = new Date(y, m - 1, d).toLocaleDateString('es', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16);
    doc.text('Historial de estacionamiento', 14, 16);
    doc.setFontSize(11);
    doc.text(longDate.charAt(0).toUpperCase() + longDate.slice(1), 14, 24);
    doc.setFontSize(9);
    doc.setTextColor(110, 110, 110);
    doc.text(
      `Generado por ${operator?.name ?? '—'} · ${new Date().toLocaleString('es')} · ${dayRecords.length} registro${dayRecords.length === 1 ? '' : 's'}`,
      14,
      30,
    );

    autoTable(doc, {
      startY: 36,
      head: [
        ['Placa', 'Tipo', 'Entrada', 'Operador entrada', 'Salida', 'Operador salida', 'Duración', 'Detalles'],
      ],
      body: dayRecords.map((record) => [
        record.placa,
        tipoLabel(record.tipo),
        formatTime(record.entradaTime),
        record.operadorEntrada.name,
        record.salidaTime ? formatTime(record.salidaTime) : '—',
        record.operadorSalida?.name ?? '—',
        record.salidaTime
          ? formatDuration(
              new Date(record.salidaTime).getTime() - new Date(record.entradaTime).getTime(),
            )
          : '—',
        getExtraEntries(record, customFields)
          .map(({ field, value }) => `${field.label}: ${formatExtraValue(value, field)}`)
          .join(' · ') || '—',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [246, 167, 35], textColor: [21, 23, 27] },
      columnStyles: { 7: { cellWidth: 70 } },
    });

    doc.save(`historial-${key}.pdf`);
  };

  const activeTimeFilters = [dateFrom, dateTo, timeFrom, timeTo].filter(Boolean).length;
  const clearTimeFilters = () => {
    setDateFrom('');
    setDateTo('');
    setTimeFrom('');
    setTimeTo('');
  };

  // Every action here is admin-only (records in Historial are always closed
  // — see the permission rule in parking-records.service.ts) and any record
  // touched has to disappear from this list: an edited-and-still-closed
  // record stays but updates in place, while cancel/reopen both remove it
  // (cancelled records vanish everywhere; reopened ones move to "Dentro").
  const handleEditSaved = (updated: ParkingRecord) => {
    setRecords((current) => current.map((r) => (r.id === updated.id ? updated : r)));
    setEditingRecord(null);
    onToast('Registro actualizado');
  };

  const openCancel = (record: ParkingRecord) => {
    setCancelingRecord(record);
    setCancelReason('');
    setCancelError(null);
  };

  const closeCancel = () => {
    if (cancelBusy) return;
    setCancelingRecord(null);
    setCancelError(null);
  };

  const confirmCancel = async () => {
    if (!cancelingRecord) return;
    setCancelBusy(true);
    setCancelError(null);
    try {
      await cancelRecordAction(cancelingRecord.id, { reason: cancelReason.trim() || undefined });
      setRecords((current) => current.filter((r) => r.id !== cancelingRecord.id));
      setCancelingRecord(null);
      onToast('Registro cancelado');
    } catch {
      setCancelError('No se pudo cancelar el registro');
    } finally {
      setCancelBusy(false);
    }
  };

  const closeReopen = () => {
    if (reopenBusy) return;
    setReopeningRecord(null);
    setReopenError(null);
  };

  const confirmReopen = async () => {
    if (!reopeningRecord) return;
    setReopenBusy(true);
    setReopenError(null);
    try {
      await reopenRecordAction(reopeningRecord.id);
      setRecords((current) => current.filter((r) => r.id !== reopeningRecord.id));
      setReopeningRecord(null);
      onToast('Registro reabierto — ahora figura en Dentro');
    } catch {
      setReopenError('No se pudo reabrir el registro');
    } finally {
      setReopenBusy(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp .3s both' }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Historial</div>

      <div data-tour="historial-filtros" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ flex: 2, minWidth: 160 }}>
          <SearchField value={query} onChange={setQuery} placeholder="Buscar por placa" />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <SelectField
            value={tipoFilter}
            onChange={(value) => setTipoFilter(value as VehicleType | 'todos')}
            ariaLabel="Filtrar por tipo de vehículo"
            active={tipoFilter !== 'todos'}
            options={[
              { value: 'todos', label: 'Todos' },
              { value: 'auto', label: 'Auto' },
              { value: 'moto', label: 'Moto' },
            ]}
          />
        </div>
        <button
          onClick={() => setShowFilters(true)}
          className="ui-btn"
          style={{
            position: 'relative',
            flexShrink: 0,
            width: 48,
            border: `1px solid ${activeTimeFilters > 0 ? 'rgba(217,164,65,0.45)' : colors.border}`,
            background: activeTimeFilters > 0 ? colors.accentBgSofter : colors.bgInput,
            color: activeTimeFilters > 0 ? colors.accent : colors.textPrimary,
            cursor: 'pointer',
            borderRadius: 13,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          aria-label="Filtrar por fecha y horario"
          title="Filtrar por fecha y horario"
        >
          <SlidersHorizontal size={17} strokeWidth={2} />
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

      {loading && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '60px 16px',
            border: `1px dashed ${colors.border}`,
            borderRadius: 12,
          }}
        >
          <LoadingSquares />
        </div>
      )}

      {!loading && filteredRecords.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 16px',
            color: colors.textDim,
            fontSize: 14,
            border: `1px dashed ${colors.border}`,
            borderRadius: 12,
          }}
        >
          Sin registros que coincidan.
        </div>
      )}

      <div ref={listRef} data-tour="historial-lista" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {groups.map(([key, groupRecords]) => (
          <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                background: colors.bg,
                padding: '6px 2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: colors.textMuted }}>
                  {formatDateHeading(key)}
                </span>
                <span style={{ fontSize: 11.5, color: colors.textDim }}>
                  {groupRecords.length} {groupRecords.length === 1 ? 'registro' : 'registros'}
                </span>
              </div>
              <button
                onClick={() => downloadDayPdf(key)}
                aria-label={`Descargar PDF del ${formatDateHeading(key)}`}
                title="Descargar PDF del día"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  border: `1px solid ${colors.border}`,
                  background: colors.bgCard,
                  color: colors.textMuted,
                  cursor: 'pointer',
                  padding: '5px 10px',
                  borderRadius: 999,
                  font: 'inherit',
                  fontWeight: 600,
                  fontSize: 11,
                  flexShrink: 0,
                }}
              >
                <FileDown size={13} strokeWidth={2} />
                PDF
              </button>
            </div>

            {groupRecords.map((record) => {
              const extraEntries = getExtraEntries(record, customFields);
              return (
                <div
                  key={record.id}
                  className="historial-record"
                  style={{
                    background: colors.bgCard,
                    border: `1px solid ${colors.border}`,
                    borderRadius: 14,
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                      <span style={{ display: 'flex', color: colors.textDim, flexShrink: 0 }}>
                        <VehicleIcon tipo={record.tipo} size={15} />
                      </span>
                      <span style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 14.5 }}>
                        {record.placa}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '3px 9px',
                        borderRadius: 999,
                        background: colors.bgInputAlt,
                        color: colors.textMuted,
                        whiteSpace: 'nowrap',
                        flexShrink: 0,
                      }}
                    >
                      {record.operadorEntrada.name}
                      {record.operadorSalida && record.operadorSalida.id !== record.operadorEntrada.id
                        ? ` → ${record.operadorSalida.name}`
                        : ''}
                    </span>
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      fontFamily: fonts.mono,
                      fontSize: 11.5,
                      color: colors.textMuted,
                    }}
                  >
                    <span>
                      {formatTime(record.entradaTime)}
                      {record.salidaTime ? ` – ${formatTime(record.salidaTime)}` : ''}
                    </span>
                    <span style={{ color: colors.accent, fontWeight: 700, flexShrink: 0 }}>
                      {record.salidaTime
                        ? formatDuration(
                            new Date(record.salidaTime).getTime() - new Date(record.entradaTime).getTime(),
                          )
                        : '—'}
                    </span>
                  </div>

                  {extraEntries.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {extraEntries.map(({ field, value }) => (
                        <span
                          key={field.id}
                          style={{
                            fontSize: 10.5,
                            color: colors.textMuted,
                            background: colors.bgInputAlt,
                            borderRadius: 999,
                            padding: '3px 9px',
                          }}
                        >
                          {field.label}: {formatExtraValue(value, field)}
                        </span>
                      ))}
                    </div>
                  )}

                  {isAdmin && (
                    <div style={{ display: 'flex', gap: 6, borderTop: `1px dashed ${colors.border}`, paddingTop: 9 }}>
                      <button
                        onClick={() => setEditingRecord(record)}
                        className="ui-btn"
                        aria-label="Editar registro"
                        title="Editar"
                        style={iconButtonStyle}
                      >
                        <Pencil size={14} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => setReopeningRecord(record)}
                        className="ui-btn"
                        aria-label="Reabrir salida"
                        title="Reabrir salida"
                        style={iconButtonStyle}
                      >
                        <Undo2 size={14} strokeWidth={2} />
                      </button>
                      <button
                        onClick={() => openCancel(record)}
                        className="ui-btn"
                        aria-label="Cancelar registro"
                        title="Cancelar"
                        style={{ ...iconButtonStyle, borderColor: colors.error, color: colors.error }}
                      >
                        <Trash2 size={14} strokeWidth={2} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ))}

        {remaining > 0 && (
          <button
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            style={{
              border: `1px dashed ${colors.borderDashed}`,
              background: 'transparent',
              color: colors.textMuted,
              cursor: 'pointer',
              padding: '13px 18px',
              borderRadius: 12,
              font: 'inherit',
              fontWeight: 600,
              fontSize: 13,
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

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onSaved={handleEditSaved}
          onCancel={() => setEditingRecord(null)}
        />
      )}

      {cancelingRecord && (
        <ConfirmActionSheet
          title="Cancelar registro"
          description={`Vas a cancelar la visita de ${cancelingRecord.placa}. No se borra, pero deja de figurar en Historial.`}
          confirmLabel="Cancelar registro"
          busyLabel="Cancelando…"
          destructive
          busy={cancelBusy}
          error={cancelError}
          onConfirm={confirmCancel}
          onCancel={closeCancel}
          extraContent={
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label htmlFor="historial-cancel-reason" style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>
                Motivo (opcional)
              </label>
              <textarea
                id="historial-cancel-reason"
                value={cancelReason}
                onChange={(event) => setCancelReason(event.target.value)}
                rows={3}
                placeholder="Ej: se cargó dos veces por error"
                style={{
                  border: `1px solid ${colors.border}`,
                  background: colors.bgInput,
                  borderRadius: 10,
                  padding: '11px 13px',
                  font: 'inherit',
                  fontSize: 16,
                  color: colors.textPrimary,
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
            </div>
          }
        />
      )}

      {reopeningRecord && (
        <ConfirmActionSheet
          title="Reabrir salida"
          description={`Esto va a borrar la salida registrada de ${reopeningRecord.placa} y el vehículo va a volver a figurar como "Dentro".`}
          confirmLabel="Reabrir salida"
          busyLabel="Reabriendo…"
          busy={reopenBusy}
          error={reopenError}
          onConfirm={confirmReopen}
          onCancel={closeReopen}
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
  fontSize: 12,
  fontWeight: 600,
  color: colors.textMuted,
  marginBottom: 6,
  display: 'block',
};

const dateTimeInputStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: `1px solid ${colors.border}`,
  background: colors.bgInput,
  borderRadius: 11,
  padding: '12px 13px',
  font: 'inherit',
  fontSize: 16,
  color: colors.textPrimary,
  outline: 'none',
};

const sectionHeadingStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 13,
  fontWeight: 700,
  color: colors.textPrimary,
  marginBottom: 10,
};

function daysAgoKey(days: number): string {
  return dateKey(new Date(Date.now() - days * 86_400_000));
}

const DATE_PRESETS: { label: string; from: () => string; to: () => string }[] = [
  { label: 'Hoy', from: () => daysAgoKey(0), to: () => daysAgoKey(0) },
  { label: 'Ayer', from: () => daysAgoKey(1), to: () => daysAgoKey(1) },
  { label: '7 días', from: () => daysAgoKey(6), to: () => daysAgoKey(0) },
  { label: '30 días', from: () => daysAgoKey(29), to: () => daysAgoKey(0) },
];

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

  // 'use client' components still render on the server for the initial
  // HTML, where `document` doesn't exist — createPortal(..., document.body)
  // would throw there.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        onClick={onClose}
        aria-hidden
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
          maxHeight: '85vh',
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
          <div style={{ fontWeight: 700, fontSize: 17 }}>Filtrar historial</div>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            style={{
              width: 34,
              height: 34,
              border: `1px solid ${colors.border}`,
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
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: 20,
          }}
        >
          <div>
            <div style={sectionHeadingStyle}>
              <Calendar size={15} strokeWidth={2} style={{ color: colors.accent }} />
              Rango de fechas
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 12 }}>
              {DATE_PRESETS.map((preset) => {
                const active = dateFrom === preset.from() && dateTo === preset.to();
                return (
                  <button
                    key={preset.label}
                    onClick={() => {
                      onDateFromChange(preset.from());
                      onDateToChange(preset.to());
                    }}
                    className="ui-btn"
                    style={{
                      border: `1px solid ${active ? 'rgba(217,164,65,0.45)' : colors.border}`,
                      background: active ? colors.accentBgSoft : colors.bgInputAlt,
                      color: active ? colors.accent : colors.textMuted,
                      cursor: 'pointer',
                      padding: '7px 13px',
                      borderRadius: 999,
                      font: 'inherit',
                      fontWeight: 700,
                      fontSize: 12.5,
                    }}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
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
                  className="ui-input"
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
                  className="ui-input"
                  style={dateTimeInputStyle}
                />
              </div>
            </div>
          </div>

          <div>
            <div style={sectionHeadingStyle}>
              <ClockIcon size={15} strokeWidth={2} style={{ color: colors.accent }} />
              Horario <span style={{ color: colors.textDim, fontWeight: 600 }}>(opcional)</span>
            </div>
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
                  className="ui-input"
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
                  className="ui-input"
                  style={dateTimeInputStyle}
                />
              </div>
            </div>
            <div style={{ fontSize: 11.5, color: colors.textDim, marginTop: 9, lineHeight: 1.5 }}>
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
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textMuted,
              cursor: 'pointer',
              padding: 15,
              borderRadius: 12,
              font: 'inherit',
              fontWeight: 600,
              fontSize: 14,
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
              borderRadius: 12,
              font: 'inherit',
              fontWeight: 700,
              fontSize: 14,
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
