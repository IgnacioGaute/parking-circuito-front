'use client';

import { ArrowLeft, Bike, Calendar, Car, Check, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getActiveFieldDefinitionsAction } from '@/actions/field-definitions.actions';
import {
  createEntradaAction,
  getFrequentAction,
  getInsideAction,
} from '@/actions/parking-records.actions';
import { SearchField } from '@/components/ui/SearchField';
import { formatDate, formatTime, tipoColors, tipoLabel } from '@/lib/format';
import { useStaggerReveal } from '@/lib/use-stagger-reveal';
import { colors, fonts } from '@/styles/theme';
import type { FieldDefinition, FrequentPlate, VehicleType } from '@/types';
import { SuccessOverlay } from './SuccessOverlay';

interface EntradaFormProps {
  onRegistered: () => void;
}

const DEFAULT_FIELDS: FieldDefinition[] = [
  {
    id: 'sys-placa',
    key: 'placa',
    label: 'Placa',
    type: 'text',
    required: true,
    options: null,
    sortOrder: 0,
    active: true,
    isSystem: true,
    createdAt: '',
  },
  {
    id: 'sys-tipo',
    key: 'tipo',
    label: 'Tipo de vehículo',
    type: 'select',
    required: true,
    options: ['auto', 'moto'],
    sortOrder: 1,
    active: true,
    isSystem: true,
    createdAt: '',
  },
];

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: colors.textMuted,
};

const customInputStyle: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  background: colors.bgInput,
  borderRadius: 12,
  padding: '14px 16px',
  font: 'inherit',
  fontSize: 16,
  color: colors.textPrimary,
  outline: 'none',
};

type CustomValue = string | number | boolean;

function isEmptyValue(value: CustomValue | undefined): boolean {
  return value === undefined || value === null || value === '';
}

function formatExtraValue(value: unknown, field?: FieldDefinition): string {
  if (value === undefined || value === null || value === '') return '—';
  if (field?.type === 'boolean') return value === true ? 'Sí' : 'No';
  return String(value);
}

function matchesFrequentQuery(plate: FrequentPlate, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return false;
  if (plate.placa.toLowerCase().includes(q)) return true;
  const nombre = plate.extraFields?.nombre;
  return typeof nombre === 'string' && nombre.toLowerCase().includes(q);
}

function VehicleIcon({ tipo, size = 15 }: { tipo: VehicleType; size?: number }) {
  return tipo === 'auto' ? (
    <Car size={size} strokeWidth={2} />
  ) : (
    <Bike size={size} strokeWidth={2} />
  );
}

export function EntradaForm({ onRegistered }: EntradaFormProps) {
  const [placa, setPlaca] = useState('');
  const [tipo, setTipo] = useState<VehicleType | null>(null);
  const [customValues, setCustomValues] = useState<Record<string, CustomValue>>({});
  const [fields, setFields] = useState<FieldDefinition[]>(DEFAULT_FIELDS);
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'success' | 'closing' | 'error' | 'error-closing'>(
    'idle',
  );
  const [successInfo, setSuccessInfo] = useState<{ placa: string; tipo: VehicleType } | null>(
    null,
  );
  const [errorInfo, setErrorInfo] = useState<{ message: string; detail?: string } | null>(null);
  const [frequentPlates, setFrequentPlates] = useState<FrequentPlate[]>([]);
  const [frequentQuery, setFrequentQuery] = useState('');
  const [selectedFrequent, setSelectedFrequent] = useState<FrequentPlate | null>(null);
  const [markFrequent, setMarkFrequent] = useState(false);

  useEffect(() => {
    getActiveFieldDefinitionsAction()
      .then((result) => setFields([...result].sort((a, b) => a.sortOrder - b.sortOrder)))
      .catch(() => undefined);
    getFrequentAction()
      .then(setFrequentPlates)
      .catch(() => undefined);
  }, []);

  // Everything rendered through the generic input (renderCustom), not just
  // non-system fields — some system fields (nombre, dni) are locked/required
  // but still plain text/number inputs, not the bespoke placa/tipo UI. "foto"
  // is a leftover system field with no UI anymore (photo upload was removed).
  const customFields = fields.filter(
    (f) => f.key !== 'placa' && f.key !== 'tipo' && f.key !== 'foto',
  );

  const frequentMatches = useMemo(
    () =>
      frequentQuery.trim()
        ? frequentPlates.filter((plate) => matchesFrequentQuery(plate, frequentQuery)).slice(0, 5)
        : [],
    [frequentPlates, frequentQuery],
  );
  const matchesRef = useStaggerReveal<HTMLDivElement>(
    '.frequent-match',
    frequentMatches.map((p) => p.placa).join(','),
  );

  const selectedExtraEntries = useMemo(() => {
    if (!selectedFrequent) return [];
    const extraFields = selectedFrequent.extraFields ?? {};
    return customFields
      .map((field) => ({ field, value: extraFields[field.key] }))
      .filter(({ value }) => value !== undefined && value !== null && value !== '');
  }, [selectedFrequent, customFields]);

  // A field required today might not have a value on an older record (e.g.
  // DNI added after this plate's last visit) — catch that before letting
  // the operator register with incomplete data.
  const missingRequiredFields = useMemo(() => {
    if (!selectedFrequent) return [];
    return customFields.filter((field) => {
      if (!field.required) return false;
      const value = selectedFrequent.extraFields?.[field.key];
      return value === undefined || value === null || value === '';
    });
  }, [selectedFrequent, customFields]);

  const busy = phase !== 'idle';
  const disabled =
    !placa.trim() ||
    !tipo ||
    busy ||
    customFields.some((f) => f.required && isEmptyValue(customValues[f.key]));

  const setCustomValue = (key: string, value: CustomValue) => {
    setCustomValues((current) => ({ ...current, [key]: value }));
  };

  // Shared by both entry points — the manual form and a one-tap register
  // from a frequent plate's detail card — so they go through the exact same
  // phases, success animation and error handling.
  const submitEntrada = async (payload: {
    placa: string;
    tipo: VehicleType;
    extraFields: Record<string, CustomValue>;
    markedFrequent?: boolean;
  }) => {
    setPhase('submitting');
    setErrorInfo(null);
    try {
      const record = await createEntradaAction({
        placa: payload.placa,
        tipo: payload.tipo,
        extraFields:
          Object.keys(payload.extraFields).length > 0 ? payload.extraFields : undefined,
        markedFrequent: payload.markedFrequent || undefined,
      });
      setSuccessInfo({ placa: record.placa, tipo: record.tipo });
      setPhase('success');
      // Hold on the risen wave/checkmark for a beat, then drain the wave
      // back down (reverse of how it rose) before resetting the form —
      // same choreography as the exit-confirmation animation.
      setTimeout(() => {
        setPhase('closing');
        setTimeout(() => {
          setPlaca('');
          setTipo(null);
          setCustomValues({});
          setMarkFrequent(false);
          setPhase('idle');
          setSuccessInfo(null);
          onRegistered();
          getFrequentAction()
            .then(setFrequentPlates)
            .catch(() => undefined);
        }, 800);
      }, 1200);
    } catch (err) {
      // Server Actions forward a thrown Error's .message to the client —
      // the backend already returns specific, Spanish, user-facing text for
      // every known validation case (e.g. "La patente XXX ya tiene una
      // entrada registrada sin salida"), so surface it instead of a generic
      // catch-all string.
      const message = err instanceof Error && err.message ? err.message : 'No se pudo registrar la entrada';

      // When the conflict is "this plate is already inside", tell the
      // operator since when — best-effort: if the lookup fails or finds
      // nothing (a different kind of error), the overlay still shows fine
      // without a detail line.
      let detail: string | undefined;
      try {
        const placaUpper = payload.placa.trim().toUpperCase();
        const existing = (await getInsideAction(placaUpper)).find((r) => r.placa === placaUpper);
        if (existing) {
          detail = `Entró ${formatDate(existing.entradaTime)} · ${formatTime(existing.entradaTime)}`;
        }
      } catch {
        // ignore — detail is just a nice-to-have
      }

      setErrorInfo({ message, detail });
      setPhase('error');
      // Same hold-then-drain choreography as the success overlay, just
      // without resetting the form — the operator still needs to fix or
      // retry whatever they typed.
      setTimeout(() => {
        setPhase('error-closing');
        setTimeout(() => {
          setPhase('idle');
          setErrorInfo(null);
        }, 800);
      }, 2200);
    }
  };

  const handleSubmit = () => {
    if (disabled || !tipo) return;
    const extraFields: Record<string, CustomValue> = {};
    for (const field of customFields) {
      const value = customValues[field.key];
      if (!isEmptyValue(value)) extraFields[field.key] = value;
    }
    void submitEntrada({ placa: placa.trim(), tipo, extraFields, markedFrequent: markFrequent });
  };

  // No autofill: tapping "Registrar con estos datos" registers the entrada
  // directly from the selected plate's own data — the manual fields below
  // are never touched.
  const registerFromFrequent = (plate: FrequentPlate) => {
    if (busy || missingRequiredFields.length > 0) return;
    const extraFields: Record<string, CustomValue> = {};
    for (const field of customFields) {
      const value = plate.extraFields?.[field.key];
      if (value !== undefined && value !== null && value !== '') {
        extraFields[field.key] = value as CustomValue;
      }
    }
    setSelectedFrequent(null);
    setFrequentQuery('');
    void submitEntrada({ placa: plate.placa, tipo: plate.tipo, extraFields });
  };

  const renderPlaca = () => (
    <div key="placa" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={labelStyle}>Placa</label>
      <input
        value={placa}
        onChange={(event) => setPlaca(event.target.value.toUpperCase())}
        placeholder="ABC-123"
        className="ui-input"
        style={{
          border: `1px solid ${colors.borderDashed}`,
          background: colors.bgInput,
          borderRadius: 12,
          padding: '14px 16px',
          fontFamily: fonts.mono,
          fontSize: 23,
          fontWeight: 600,
          letterSpacing: '0.03em',
          color: colors.textPrimary,
          outline: 'none',
        }}
      />
    </div>
  );

  // A sliding highlight (transform, not a background swap) behind whichever
  // option is picked — the highlight travels between the two slots instead
  // of one button's tint cutting out while the other's cuts in. Since it's
  // always an even 2-way split, the position is just "which half" — no
  // measuring needed, unlike NavTabs' variable-width sidebar pill.
  const renderTipo = () => (
    <div key="tipo" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={labelStyle}>Tipo de vehículo</label>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          border: `1px solid ${colors.border}`,
          background: colors.bgInput,
          borderRadius: 13,
          padding: 3,
        }}
      >
        <div
          aria-hidden
          style={{
            position: 'absolute',
            top: 3,
            bottom: 3,
            left: 3,
            width: 'calc(50% - 3px)',
            borderRadius: 10,
            background: colors.accentBgSoft,
            boxShadow: tipo ? `inset 0 0 0 1px rgba(217,164,65,0.35)` : 'none',
            opacity: tipo ? 1 : 0,
            transform: tipo === 'moto' ? 'translateX(100%)' : 'translateX(0)',
            transition: 'transform .25s cubic-bezier(.4,0,.2,1), opacity .2s ease',
          }}
        />
        <button
          onClick={() => setTipo('auto')}
          className="ui-btn"
          style={{
            position: 'relative',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            background: 'transparent',
            color: tipo === 'auto' ? colors.accent : colors.textMuted,
            padding: '11px 0',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            transition: 'color 0.15s ease',
          }}
        >
          <Car size={17} strokeWidth={2} />
          Auto
        </button>
        <button
          onClick={() => setTipo('moto')}
          className="ui-btn"
          style={{
            position: 'relative',
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            background: 'transparent',
            color: tipo === 'moto' ? colors.accent : colors.textMuted,
            padding: '11px 0',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            transition: 'color 0.15s ease',
          }}
        >
          <Bike size={17} strokeWidth={2} />
          Moto
        </button>
      </div>
    </div>
  );

  const renderCustom = (field: FieldDefinition) => {
    const value = customValues[field.key];
    return (
      <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label style={labelStyle}>
          {field.label}
          {field.required ? '' : ' (opcional)'}
        </label>
        {field.type === 'select' ? (
          <select
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setCustomValue(field.key, event.target.value)}
            className="ui-input"
            style={{ ...customInputStyle, cursor: 'pointer' }}
          >
            <option value="">Seleccioná una opción</option>
            {(field.options ?? []).map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        ) : field.type === 'boolean' ? (
          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 9,
              fontSize: 14,
              color: colors.textPrimary,
              cursor: 'pointer',
            }}
          >
            <input
              type="checkbox"
              checked={value === true}
              onChange={(event) => setCustomValue(field.key, event.target.checked)}
            />
            Sí
          </label>
        ) : field.type === 'number' ? (
          <input
            type="number"
            value={typeof value === 'number' ? value : ''}
            onChange={(event) =>
              setCustomValue(
                field.key,
                event.target.value === '' ? '' : Number(event.target.value),
              )
            }
            className="ui-input"
            style={customInputStyle}
          />
        ) : (
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setCustomValue(field.key, event.target.value)}
            className="ui-input"
            style={customInputStyle}
          />
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {frequentPlates.length > 0 && (
        <div
          style={{
            position: 'relative',
            overflow: 'hidden',
            background: colors.accentBgSofter,
            border: `1px solid ${colors.accentBgBadge}`,
            borderRadius: 16,
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 13,
          }}
        >
          <div
            aria-hidden
            style={{
              position: 'absolute',
              top: -30,
              right: -30,
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: colors.accentBgSoft,
              pointerEvents: 'none',
            }}
          />
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, position: 'relative' }}>
            <span
              style={{
                width: 34,
                height: 34,
                flexShrink: 0,
                borderRadius: 10,
                background: colors.accentBgSoft,
                color: colors.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px -2px rgba(217,164,65,0.4)',
              }}
            >
              <Star size={16} strokeWidth={2} fill="currentColor" />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.3 }}>
                ¿Es un vehículo frecuente?
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.3 }}>
                Buscá por placa o por nombre para ver sus datos.
              </div>
            </div>
          </div>

          <SearchField
            value={frequentQuery}
            onChange={(value) => {
              setFrequentQuery(value);
              setSelectedFrequent(null);
            }}
            placeholder="Placa o nombre…"
          />

          {frequentQuery.trim() && !selectedFrequent && (
            <div ref={matchesRef} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {frequentMatches.length === 0 ? (
                <div style={{ padding: 14, textAlign: 'center', fontSize: 12.5, color: colors.textDim }}>
                  No hay ningún frecuente con &quot;{frequentQuery.trim()}&quot;.
                </div>
              ) : (
                frequentMatches.map((plate) => {
                  const nombre = plate.extraFields?.nombre;
                  return (
                    <button
                      key={plate.placa}
                      onClick={() => setSelectedFrequent(plate)}
                      className="ui-btn frequent-match"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 11,
                        border: `1px solid ${colors.border}`,
                        background: colors.bgCard,
                        borderRadius: 12,
                        padding: '11px 13px',
                        cursor: 'pointer',
                        font: 'inherit',
                      }}
                    >
                      <span
                        style={{
                          width: 34,
                          height: 34,
                          flexShrink: 0,
                          borderRadius: 10,
                          background: colors.bgInputAlt,
                          color: colors.textMuted,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <VehicleIcon tipo={plate.tipo} size={16} />
                      </span>
                      <div style={{ minWidth: 0, flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 14.5 }}>
                            {plate.placa}
                          </span>
                          <span style={{ fontSize: 11.5, color: colors.textDim }}>
                            {tipoLabel(plate.tipo)}
                          </span>
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: colors.textMuted,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {typeof nombre === 'string' && nombre ? `${nombre} · ` : ''}
                          {formatDate(plate.lastEntradaTime)} · {formatTime(plate.lastEntradaTime)}
                        </div>
                      </div>
                      <span
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4,
                          fontSize: 10.5,
                          fontWeight: 700,
                          padding: '3px 9px',
                          borderRadius: 999,
                          background: colors.accentBgSoft,
                          color: colors.accent,
                          whiteSpace: 'nowrap',
                          flexShrink: 0,
                        }}
                      >
                        <Star size={10} strokeWidth={2.2} fill="currentColor" />
                        {plate.visitCount}
                      </span>
                    </button>
                  );
                })
              )}
            </div>
          )}

          {selectedFrequent && (
            <div
              style={{
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                overflow: 'hidden',
                display: 'flex',
                flexDirection: 'column',
                animation: 'fadeUp .25s both',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '14px 16px',
                  background: colors.bgInputAlt,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
                  <span
                    style={{
                      width: 40,
                      height: 40,
                      flexShrink: 0,
                      borderRadius: 11,
                      background: tipoColors().bg,
                      color: tipoColors().color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <VehicleIcon tipo={selectedFrequent.tipo} size={19} />
                  </span>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 19, letterSpacing: '0.02em', lineHeight: 1.2 }}>
                      {selectedFrequent.placa}
                    </div>
                    <div style={{ fontSize: 11.5, color: colors.textDim }}>{tipoLabel(selectedFrequent.tipo)}</div>
                  </div>
                </div>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '5px 11px',
                    borderRadius: 999,
                    background: colors.accentBgSoft,
                    color: colors.accent,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <Star size={11} strokeWidth={2.2} fill="currentColor" />
                  {selectedFrequent.visitCount} visitas
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', padding: '4px 16px' }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '10px 0',
                    borderBottom: `1px dashed ${colors.border}`,
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 12.5, color: colors.textDim }}>
                    <Calendar size={13} strokeWidth={2} />
                    Última vez
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {formatDate(selectedFrequent.lastEntradaTime)} ·{' '}
                    {formatTime(selectedFrequent.lastEntradaTime)}
                  </span>
                </div>
                {selectedExtraEntries.map(({ field, value }, i) => (
                  <div
                    key={field.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 10,
                      padding: '10px 0',
                      borderBottom:
                        i === selectedExtraEntries.length - 1 ? 'none' : `1px dashed ${colors.border}`,
                    }}
                  >
                    <span style={{ fontSize: 12.5, color: colors.textDim }}>{field.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600, textAlign: 'right' }}>
                      {formatExtraValue(value, field)}
                    </span>
                  </div>
                ))}
              </div>

              <div style={{ padding: '10px 16px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {missingRequiredFields.length > 0 && (
                  <div style={{ fontSize: 12, color: colors.error, fontWeight: 600, lineHeight: 1.5 }}>
                    Falta {missingRequiredFields.map((f) => f.label).join(', ')} — completalo con el
                    formulario de abajo.
                  </div>
                )}

                <div style={{ display: 'flex', gap: 9 }}>
                  <button
                    onClick={() => setSelectedFrequent(null)}
                    disabled={busy}
                    className="ui-btn"
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      border: `1px solid ${colors.border}`,
                      background: 'transparent',
                      color: colors.textMuted,
                      borderRadius: 11,
                      padding: '13px 6px',
                      fontSize: 12.5,
                      fontWeight: 700,
                      whiteSpace: 'nowrap',
                      cursor: busy ? 'default' : 'pointer',
                      font: 'inherit',
                      opacity: busy ? 0.6 : 1,
                    }}
                  >
                    <ArrowLeft size={13} strokeWidth={2.3} />
                    Buscar otra
                  </button>
                  <button
                    onClick={() => registerFromFrequent(selectedFrequent)}
                    disabled={busy || missingRequiredFields.length > 0}
                    className={busy || missingRequiredFields.length > 0 ? 'ui-btn' : 'ui-btn ui-cta'}
                    style={{
                      flex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 7,
                      border: 'none',
                      background:
                        busy || missingRequiredFields.length > 0
                          ? colors.accentDisabledBg
                          : colors.accent,
                      color: colors.accentContrast,
                      borderRadius: 11,
                      padding: 13,
                      fontSize: 13.5,
                      fontWeight: 800,
                      cursor: busy || missingRequiredFields.length > 0 ? 'default' : 'pointer',
                      font: 'inherit',
                      opacity: busy || missingRequiredFields.length > 0 ? 0.7 : 1,
                      boxShadow:
                        busy || missingRequiredFields.length > 0
                          ? 'none'
                          : '0 4px 14px -3px rgba(217,164,65,0.5)',
                    }}
                  >
                    {phase === 'submitting' ? (
                      'Registrando…'
                    ) : (
                      <>
                        <Check size={15} strokeWidth={2.5} />
                        Registrar con estos datos
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {frequentPlates.length > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, height: 1, background: colors.border }} />
          <span
            style={{
              fontSize: 10.5,
              fontWeight: 700,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: colors.textDim,
            }}
          >
            o completá a mano
          </span>
          <div style={{ flex: 1, height: 1, background: colors.border }} />
        </div>
      )}

      <div
        data-tour="registrar-form"
        style={{
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          padding: 18,
          display: 'flex',
          flexDirection: 'column',
          gap: 17,
        }}
      >
        {fields.map((field) => {
          if (field.key === 'foto') return null;
          if (field.isSystem && field.key === 'placa') return renderPlaca();
          if (field.isSystem && field.key === 'tipo') return renderTipo();
          return renderCustom(field);
        })}

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            border: `1px solid ${markFrequent ? 'rgba(217,164,65,0.35)' : colors.border}`,
            background: markFrequent ? colors.accentBgSofter : 'transparent',
            borderRadius: 13,
            padding: '13px 14px',
            transition: 'background .15s ease, border-color .15s ease',
          }}
        >
          <button
            onClick={() => setMarkFrequent((current) => !current)}
            className="ui-btn"
            aria-pressed={markFrequent}
            aria-label="Marcar como frecuente"
            style={{
              position: 'relative',
              flexShrink: 0,
              width: 40,
              height: 23,
              borderRadius: 999,
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              background: markFrequent ? colors.accent : colors.bgInputAlt,
              transition: 'background .18s ease',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 2.5,
                left: 2.5,
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#fff',
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                transform: markFrequent ? 'translateX(17px)' : 'translateX(0)',
                transition: 'transform .22s cubic-bezier(.4,0,.2,1)',
              }}
            />
          </button>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Star size={13} strokeWidth={2.2} fill="currentColor" style={{ color: colors.accent }} />
              Marcar como frecuente
            </div>
            <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
              Va a aparecer en &quot;Frecuentes&quot; aunque sea su primera vez.
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled}
        className={disabled ? undefined : 'ui-btn ui-cta'}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          padding: 16,
          borderRadius: 13,
          font: 'inherit',
          fontWeight: 700,
          fontSize: 15,
          background: disabled ? colors.accentDisabledBg : colors.accent,
          color: colors.accentContrast,
          opacity: disabled ? 0.6 : 1,
          boxShadow: disabled ? 'none' : '0 6px 18px -4px rgba(217,164,65,0.55)',
        }}
      >
        {phase === 'submitting' ? (
          'Registrando…'
        ) : (
          <>
            <Check size={17} strokeWidth={2.5} />
            Registrar entrada
          </>
        )}
      </button>

      {(phase === 'success' || phase === 'closing') &&
        successInfo &&
        createPortal(
          <SuccessOverlay
            phase={phase}
            title="Entrada registrada"
            subtitle={`${successInfo.placa} · ${successInfo.tipo === 'auto' ? 'Auto' : 'Moto'}`}
          />,
          document.body,
        )}

      {(phase === 'error' || phase === 'error-closing') &&
        errorInfo &&
        createPortal(
          <SuccessOverlay
            phase={phase === 'error' ? 'success' : 'closing'}
            variant="error"
            title="No se pudo registrar"
            subtitle={errorInfo.message}
            detail={errorInfo.detail}
          />,
          document.body,
        )}
    </div>
  );
}
