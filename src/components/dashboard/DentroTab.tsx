'use client';

import { Bike, Car, Search, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getFieldDefinitionsAction } from '@/actions/field-definitions.actions';
import { getInsideAction, registerSalidaAction } from '@/actions/parking-records.actions';
import { formatDuration, formatTime, tipoColors, tipoLabel } from '@/lib/format';
import { colors, fonts } from '@/styles/theme';
import type { FieldDefinition, ParkingRecord } from '@/types';

function VehicleIcon({ tipo, size = 18 }: { tipo: 'auto' | 'moto'; size?: number }) {
  return tipo === 'auto' ? (
    <Car size={size} strokeWidth={1.8} />
  ) : (
    <Bike size={size} strokeWidth={1.8} />
  );
}

function formatExtraValue(value: unknown, field?: FieldDefinition): string {
  if (value === undefined || value === null || value === '') return '—';
  if (field?.type === 'boolean') return value === true ? 'Sí' : 'No';
  return String(value);
}

interface DentroTabProps {
  isDesktop: boolean;
  onCountChange: (count: number) => void;
}

export function DentroTab({ isDesktop, onCountChange }: DentroTabProps) {
  const [records, setRecords] = useState<ParkingRecord[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  const [customFields, setCustomFields] = useState<FieldDefinition[]>([]);
  const [confirmingRecord, setConfirmingRecord] = useState<ParkingRecord | null>(null);
  const [exitPhase, setExitPhase] = useState<'idle' | 'loading' | 'success' | 'closing'>('idle');
  const [exitError, setExitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getInsideAction()
      .then((result) => {
        if (!cancelled) setRecords(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    // All fields, not just active ones: a record can carry data for a field
    // that was later deactivated, and it still needs a label to display it.
    getFieldDefinitionsAction()
      .then((result) => {
        if (!cancelled) setCustomFields(result.filter((f) => !f.isSystem));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    onCountChange(records.length);
  }, [records.length, onCountChange]);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(interval);
  }, []);

  const matches = records.filter(
    (record) => !query || record.placa.toLowerCase().includes(query.toLowerCase()),
  );

  const closeConfirm = () => {
    if (exitPhase !== 'idle') return;
    setConfirmingRecord(null);
    setExitError(null);
  };

  const confirmExit = async () => {
    if (!confirmingRecord) return;
    setExitPhase('loading');
    setExitError(null);
    try {
      await registerSalidaAction(confirmingRecord.id);
      setExitPhase('success');
      // Hold on the risen wave/checkmark for a beat, then drain the wave
      // back down (reverse of how it rose) instead of just vanishing —
      // no toast here, the in-sheet animation already confirms the exit.
      setTimeout(() => {
        setExitPhase('closing');
        setTimeout(() => {
          setRecords((current) => current.filter((r) => r.id !== confirmingRecord.id));
          setConfirmingRecord(null);
          setExitPhase('idle');
        }, 800);
      }, 1200);
    } catch {
      setExitError('No se pudo registrar la salida. Probá de nuevo.');
      setExitPhase('idle');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp .3s both' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>Dentro</span>
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 13,
            color: colors.textMuted,
          }}
        >
          {records.length} vehículo{records.length === 1 ? '' : 's'}
        </span>
      </div>

      {records.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            strokeWidth={2}
            style={{
              position: 'absolute',
              left: 13,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textDim,
              pointerEvents: 'none',
            }}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por placa"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: `1px solid ${colors.border}`,
              background: colors.bgInput,
              borderRadius: 12,
              padding: '12px 14px 12px 38px',
              font: 'inherit',
              fontSize: 14,
              outline: 'none',
              color: colors.textPrimary,
            }}
          />
        </div>
      )}

      {!loading && records.length === 0 && (
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
          No hay vehículos dentro del estacionamiento.
        </div>
      )}

      {!loading && records.length > 0 && matches.length === 0 && (
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
          No se encontraron vehículos con esa placa.
        </div>
      )}

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: isDesktop ? 'repeat(auto-fill,minmax(270px,1fr))' : '1fr',
          gap: 14,
        }}
      >
        {matches.map((record) => {
          const durationMs = now - new Date(record.entradaTime).getTime();
          const attention = durationMs > 60 * 60 * 1000;
          return (
            <div
              key={record.id}
              style={{
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: 15,
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ display: 'flex', color: colors.textDim, flexShrink: 0 }}>
                    <VehicleIcon tipo={record.tipo} size={15} />
                  </span>
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontWeight: 700,
                      fontSize: 15,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {record.placa}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 999,
                    flexShrink: 0,
                    background: attention ? 'rgba(240,97,110,0.14)' : colors.accentBgSoft,
                    color: attention ? colors.error : colors.accent,
                  }}
                >
                  {attention ? 'Atención' : 'OK'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 12, color: colors.textMuted }}>
                <span>Entró {formatTime(record.entradaTime)}</span>
                <span style={{ color: colors.accent, fontWeight: 700, flexShrink: 0 }}>
                  {formatDuration(durationMs)}
                </span>
              </div>
              <button
                onClick={() => setConfirmingRecord(record)}
                style={{
                  border: `1px solid ${colors.border}`,
                  background: 'transparent',
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  padding: 11,
                  borderRadius: 10,
                  font: 'inherit',
                  fontWeight: 600,
                  fontSize: 13.5,
                }}
              >
                Registrar salida
              </button>
            </div>
          );
        })}
      </div>

      {confirmingRecord && (
        <ExitConfirmModal
          record={confirmingRecord}
          customFields={customFields}
          now={now}
          phase={exitPhase}
          error={exitError}
          onCancel={closeConfirm}
          onConfirm={confirmExit}
        />
      )}
    </div>
  );
}

type ExitPhase = 'idle' | 'loading' | 'success' | 'closing';

interface ExitConfirmModalProps {
  record: ParkingRecord;
  customFields: FieldDefinition[];
  now: number;
  phase: ExitPhase;
  error: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

function ExitConfirmModal({
  record,
  customFields,
  now,
  phase,
  error,
  onCancel,
  onConfirm,
}: ExitConfirmModalProps) {
  const typeColors = tipoColors();
  const extraFields = record.extraFields ?? {};
  const extraEntries = customFields
    .map((field) => ({ field, value: extraFields[field.key] }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '');

  const rows: { label: string; value: string }[] = [
    { label: 'Placa', value: record.placa },
    { label: 'Tipo', value: tipoLabel(record.tipo) },
    { label: 'Tiempo dentro', value: formatDuration(now - new Date(record.entradaTime).getTime()) },
    { label: 'Entró', value: formatTime(record.entradaTime) },
    { label: 'Registró entrada', value: record.operadorEntrada.name },
    ...extraEntries.map(({ field, value }) => ({
      label: field.label,
      value: formatExtraValue(value, field),
    })),
  ];

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  const busy = phase !== 'idle';

  return createPortal(
    <>
      {phase !== 'success' && phase !== 'closing' && (
        <>
          <div
            onClick={onCancel}
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
              maxHeight: '55vh',
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
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 10,
          flexShrink: 0,
        }}
      >
        <span
          style={{
            width: 36,
            height: 4,
            borderRadius: 999,
            background: colors.border,
          }}
        />
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
        <div style={{ fontWeight: 700, fontSize: 17 }}>Confirmar salida</div>
        <button
          onClick={onCancel}
          disabled={busy}
          aria-label="Cerrar"
          style={{
            width: 34,
            height: 34,
            border: `1px solid ${colors.border}`,
            borderRadius: 10,
            background: 'transparent',
            color: colors.textMuted,
            cursor: busy ? 'default' : 'pointer',
            opacity: busy ? 0 : 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'opacity .15s ease',
          }}
        >
          <X size={17} strokeWidth={2} />
        </button>
      </div>

      <div
        style={{
          minHeight: 0,
          overflowY: 'auto',
          padding: '8px 20px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: typeColors.bg,
                color: typeColors.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <VehicleIcon tipo={record.tipo} size={21} />
            </span>
            <div style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 22 }}>
              {record.placa}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: colors.bgInput,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: '16px 18px',
            }}
          >
            {rows.map((row) => (
              <div
                key={row.label}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}
              >
                <span
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    color: colors.textDim,
                    flexShrink: 0,
                  }}
                >
                  {row.label}
                </span>
                <span
                  style={{
                    fontSize: 13.5,
                    fontWeight: 700,
                    color: colors.textPrimary,
                    textAlign: 'right',
                  }}
                >
                  {row.value}
                </span>
              </div>
            ))}
          </div>

          {error && (
            <div
              style={{
                fontSize: 12.5,
                fontWeight: 600,
                color: colors.error,
                textAlign: 'center',
              }}
            >
              {error}
            </div>
          )}
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          flexShrink: 0,
          borderTop: `1px solid ${colors.border}`,
          padding: '14px 20px calc(14px + env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ width: '100%', maxWidth: 420, display: 'flex', gap: 10 }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              flex: 1,
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textMuted,
              cursor: busy ? 'default' : 'pointer',
              padding: 15,
              borderRadius: 12,
              font: 'inherit',
              fontWeight: 600,
              fontSize: 14,
              opacity: busy ? 0.5 : 1,
            }}
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              flex: 2,
              border: 'none',
              background: colors.accent,
              color: colors.accentContrast,
              cursor: busy ? 'default' : 'pointer',
              padding: 15,
              borderRadius: 12,
              font: 'inherit',
              fontWeight: 700,
              fontSize: 14,
              opacity: busy ? 0.7 : 1,
            }}
          >
            {phase === 'loading' ? 'Confirmando…' : 'Confirmar salida'}
          </button>
        </div>
      </div>
          </div>
        </>
      )}

      {(phase === 'success' || phase === 'closing') && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 800,
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: 0,
              width: '100%',
              background: `linear-gradient(180deg, ${colors.bgCard}, ${colors.bg})`,
              animation:
                phase === 'closing'
                  ? 'waveDrain .8s cubic-bezier(.65,0,.35,1) forwards'
                  : 'waveFill .8s cubic-bezier(.65,0,.35,1) forwards',
            }}
          />
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              animation: phase === 'closing' ? 'fadeOutFast .25s ease forwards' : 'none',
            }}
          >
            <svg width="60" height="60" viewBox="0 0 24 24" fill="none">
              <path
                d="m5 13 4 4 10-10"
                stroke={colors.green}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="26"
                style={{ strokeDashoffset: 26, animation: 'dash .4s ease .5s forwards' }}
              />
            </svg>
            <div
              style={{
                opacity: 0,
                animation: 'textRise .4s ease .45s forwards',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 20, color: colors.textPrimary }}>
                Salida confirmada
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted }}>
                {record.placa} · {tipoLabel(record.tipo)}
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
}
