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
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
        <span
          style={{
            fontFamily: fonts.display,
            fontSize: 22,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          Vehículos dentro
        </span>
        <span
          style={{
            background: colors.badgeInsideBg,
            color: colors.accentText,
            fontSize: 12.5,
            fontWeight: 700,
            padding: '2px 10px',
            borderRadius: 999,
          }}
        >
          {records.length}
        </span>
      </div>

      {records.length > 0 && (
        <div style={{ position: 'relative' }}>
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
          const typeColors = tipoColors(record.tipo);
          return (
            <div
              key={record.id}
              style={{
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: 16,
                padding: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: typeColors.bg,
                    color: typeColors.color,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <VehicleIcon tipo={record.tipo} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      display: 'inline-block',
                      background: colors.plateBg,
                      color: colors.plateText,
                      borderRadius: 6,
                      padding: '2px 9px',
                      fontFamily: fonts.display,
                      fontWeight: 800,
                      fontSize: 19,
                      letterSpacing: '0.05em',
                    }}
                  >
                    {record.placa}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: colors.textDim,
                      marginTop: 5,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {tipoLabel(record.tipo)} · {record.operadorEntrada.name}
                  </div>
                </div>
              </div>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: `1px dashed ${colors.border}`,
                  paddingTop: 12,
                }}
              >
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
                  <div style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 700 }}>
                    {formatTime(record.entradaTime)}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: colors.textDimmer,
                      fontWeight: 700,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em',
                    }}
                  >
                    Tiempo
                  </div>
                  <div style={{ fontFamily: fonts.display, fontSize: 16, fontWeight: 700, color: colors.accentText }}>
                    {formatDuration(now - new Date(record.entradaTime).getTime())}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setConfirmingRecord(record)}
                style={{
                  border: `1.5px solid ${colors.border}`,
                  background: 'transparent',
                  color: colors.textPrimary,
                  cursor: 'pointer',
                  padding: 11,
                  borderRadius: 10,
                  font: 'inherit',
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: 13.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
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
  const typeColors = tipoColors(record.tipo);
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
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize: 19,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
          Confirmar salida
        </div>
        <button
          onClick={onCancel}
          disabled={busy}
          aria-label="Cerrar"
          style={{
            width: 34,
            height: 34,
            border: `1.5px solid ${colors.border}`,
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span
              style={{
                width: 52,
                height: 52,
                borderRadius: 14,
                background: typeColors.bg,
                color: typeColors.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <VehicleIcon tipo={record.tipo} size={24} />
            </span>
            <div
              style={{
                display: 'inline-block',
                background: colors.plateBg,
                color: colors.plateText,
                borderRadius: 8,
                padding: '5px 14px',
                fontFamily: fonts.display,
                fontWeight: 800,
                fontSize: 26,
                letterSpacing: '0.06em',
              }}
            >
              {record.placa}
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: 16,
              padding: '18px 20px',
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
              border: `1.5px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textMuted,
              cursor: busy ? 'default' : 'pointer',
              padding: 15,
              borderRadius: 14,
              font: 'inherit',
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
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
              background: colors.error,
              color: '#fff',
              cursor: busy ? 'default' : 'pointer',
              padding: 15,
              borderRadius: 14,
              font: 'inherit',
              fontFamily: fonts.display,
              fontWeight: 800,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
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
              background: 'linear-gradient(180deg,#1c2030,#101114)',
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
                stroke="#4ade80"
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
              <div
                style={{
                  fontFamily: fonts.display,
                  fontWeight: 800,
                  fontSize: 22,
                  textTransform: 'uppercase',
                  letterSpacing: '0.03em',
                  color: '#f7f8fa',
                }}
              >
                Salida confirmada
              </div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(247,248,250,0.65)' }}>
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
