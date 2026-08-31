'use client';

import { Bike, Car, Check, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getActiveFieldDefinitionsAction } from '@/actions/field-definitions.actions';
import { createEntradaAction, getFrequentAction } from '@/actions/parking-records.actions';
import { formatDate, formatTime, tipoLabel } from '@/lib/format';
import { colors, fonts } from '@/styles/theme';
import type { FieldDefinition, FrequentPlate, VehicleType } from '@/types';

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
  borderRadius: 10,
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
  const [phase, setPhase] = useState<'idle' | 'submitting' | 'success' | 'closing'>('idle');
  const [successInfo, setSuccessInfo] = useState<{ placa: string; tipo: VehicleType } | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
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
    setError(null);
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
    } catch {
      setError('No se pudo registrar la entrada');
      setPhase('idle');
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

  const renderTipo = () => (
    <div key="tipo" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={labelStyle}>Tipo de vehículo</label>
      <div style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}>
        <button
          onClick={() => setTipo('auto')}
          className={tipo === 'auto' ? undefined : 'ui-btn ui-tipo-btn'}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            background: tipo === 'auto' ? colors.accentBgSoft : 'transparent',
            color: tipo === 'auto' ? colors.accent : colors.textMuted,
            padding: '12px 0',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            transition: 'background 0.12s ease, color 0.12s ease',
          }}
        >
          <Car size={17} strokeWidth={2} />
          Auto
        </button>
        <button
          onClick={() => setTipo('moto')}
          className={tipo === 'moto' ? undefined : 'ui-btn ui-tipo-btn'}
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            gap: 8,
            border: 'none',
            borderLeft: `1px solid ${colors.border}`,
            background: tipo === 'moto' ? colors.accentBgSoft : 'transparent',
            color: tipo === 'moto' ? colors.accent : colors.textMuted,
            padding: '12px 0',
            fontSize: 14,
            fontWeight: 700,
            cursor: 'pointer',
            display: 'flex',
            transition: 'background 0.12s ease, color 0.12s ease',
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
            style={customInputStyle}
          />
        ) : (
          <input
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setCustomValue(field.key, event.target.value)}
            style={customInputStyle}
          />
        )}
      </div>
    );
  };

  return (
    <div
      data-tour="registrar-form"
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
      }}
    >
      {frequentPlates.length > 0 && (
        <div
          style={{
            background: colors.accentBgSofter,
            border: `1px solid ${colors.accentBgBadge}`,
            borderRadius: 14,
            padding: 14,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span
              style={{
                width: 30,
                height: 30,
                flexShrink: 0,
                borderRadius: 9,
                background: colors.accentBgSoft,
                color: colors.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Star size={15} strokeWidth={2} fill="currentColor" />
            </span>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 14, fontWeight: 700, lineHeight: 1.3 }}>
                ¿Es un vehículo frecuente?
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, lineHeight: 1.3 }}>
                Buscá por placa o por nombre para ver sus datos.
              </div>
            </div>
          </div>

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
              value={frequentQuery}
              onChange={(event) => {
                setFrequentQuery(event.target.value);
                setSelectedFrequent(null);
              }}
              placeholder="Placa o nombre…"
              className="ui-input"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: `1px solid ${colors.border}`,
                background: colors.bgInput,
                borderRadius: 10,
                padding: '12px 14px 12px 38px',
                font: 'inherit',
                fontSize: 16,
                outline: 'none',
                color: colors.textPrimary,
              }}
            />
          </div>

          {frequentQuery.trim() && !selectedFrequent && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
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
                      className="ui-btn"
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        border: `1px solid ${colors.border}`,
                        background: colors.bgCard,
                        borderRadius: 10,
                        padding: '11px 13px',
                        cursor: 'pointer',
                        font: 'inherit',
                      }}
                    >
                      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                          <span style={{ color: colors.textDim, display: 'flex' }}>
                            <VehicleIcon tipo={plate.tipo} />
                          </span>
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
                borderRadius: 12,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ color: colors.textMuted, display: 'flex' }}>
                    <VehicleIcon tipo={selectedFrequent.tipo} size={18} />
                  </span>
                  <span style={{ fontFamily: fonts.mono, fontWeight: 800, fontSize: 20, letterSpacing: '0.02em' }}>
                    {selectedFrequent.placa}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textDim }}>
                    {tipoLabel(selectedFrequent.tipo)}
                  </span>
                </div>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 999,
                    background: colors.accentBgSoft,
                    color: colors.accent,
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Star size={11} strokeWidth={2.2} fill="currentColor" />
                  {selectedFrequent.visitCount} visitas
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 9,
                  borderTop: `1px solid ${colors.border}`,
                  paddingTop: 12,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <span style={{ fontSize: 12.5, color: colors.textDim }}>Última vez</span>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>
                    {formatDate(selectedFrequent.lastEntradaTime)} ·{' '}
                    {formatTime(selectedFrequent.lastEntradaTime)}
                  </span>
                </div>
                {selectedExtraEntries.map(({ field, value }) => (
                  <div key={field.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span style={{ fontSize: 12.5, color: colors.textDim }}>{field.label}</span>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{formatExtraValue(value, field)}</span>
                  </div>
                ))}
              </div>

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
                    border: `1px solid ${colors.border}`,
                    background: 'transparent',
                    color: colors.textMuted,
                    borderRadius: 10,
                    padding: 13,
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: busy ? 'default' : 'pointer',
                    font: 'inherit',
                    opacity: busy ? 0.6 : 1,
                  }}
                >
                  ← Buscar otra
                </button>
                <button
                  onClick={() => registerFromFrequent(selectedFrequent)}
                  disabled={busy || missingRequiredFields.length > 0}
                  className="ui-btn"
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
                    borderRadius: 10,
                    padding: 13,
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: busy || missingRequiredFields.length > 0 ? 'default' : 'pointer',
                    font: 'inherit',
                    opacity: busy || missingRequiredFields.length > 0 ? 0.7 : 1,
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
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: '13px 14px',
        }}
      >
        <button
          onClick={() => setMarkFrequent((current) => !current)}
          className="ui-btn"
          aria-pressed={markFrequent}
          aria-label="Marcar como frecuente"
          style={{
            flexShrink: 0,
            width: 40,
            height: 22,
            borderRadius: 999,
            border: 'none',
            padding: 2,
            cursor: 'pointer',
            background: markFrequent ? colors.accent : colors.bgInputAlt,
            display: 'flex',
            justifyContent: markFrequent ? 'flex-end' : 'flex-start',
          }}
        >
          <span
            style={{
              width: 18,
              height: 18,
              borderRadius: '50%',
              background: '#fff',
              display: 'block',
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

      {error && (
        <div style={{ fontSize: 12.5, color: colors.error, fontWeight: 600 }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled}
        className={disabled ? undefined : 'ui-btn ui-cta'}
        style={{
          border: 'none',
          cursor: disabled ? 'default' : 'pointer',
          padding: 15,
          borderRadius: 12,
          font: 'inherit',
          fontWeight: 700,
          fontSize: 15,
          background: disabled ? colors.accentDisabledBg : colors.accent,
          color: colors.accentContrast,
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {phase === 'submitting' ? 'Registrando…' : 'Registrar entrada'}
      </button>

      {(phase === 'success' || phase === 'closing') &&
        successInfo &&
        createPortal(
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
                  Entrada registrada
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted }}>
                  {successInfo.placa} · {successInfo.tipo === 'auto' ? 'Auto' : 'Moto'}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
