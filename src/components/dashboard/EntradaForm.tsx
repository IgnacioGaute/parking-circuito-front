'use client';

import { Bike, Car, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { getActiveFieldDefinitionsAction } from '@/actions/field-definitions.actions';
import { createEntradaAction, getFrequentAction } from '@/actions/parking-records.actions';
import { tipoLabel } from '@/lib/format';
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
  fontSize: 15,
  color: colors.textPrimary,
  outline: 'none',
};

type CustomValue = string | number | boolean;

function isEmptyValue(value: CustomValue | undefined): boolean {
  return value === undefined || value === null || value === '';
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
        ? frequentPlates
            .filter((plate) => plate.placa.toLowerCase().includes(frequentQuery.trim().toLowerCase()))
            .slice(0, 6)
        : [],
    [frequentPlates, frequentQuery],
  );

  // Loads the plate's last known data into the form so the operator only has
  // to review and confirm with "Registrar entrada" — same one-tap-confirm
  // pattern the rest of the app uses for anything that mutates state.
  const applyFrequent = (plate: FrequentPlate) => {
    setPlaca(plate.placa);
    setTipo(plate.tipo);
    const nextValues: Record<string, CustomValue> = {};
    for (const field of customFields) {
      const value = plate.extraFields?.[field.key];
      if (value !== undefined && value !== null) {
        nextValues[field.key] = value as CustomValue;
      }
    }
    setCustomValues(nextValues);
    setFrequentQuery('');
  };
  const busy = phase !== 'idle';
  const disabled =
    !placa.trim() ||
    !tipo ||
    busy ||
    customFields.some((f) => f.required && isEmptyValue(customValues[f.key]));

  const setCustomValue = (key: string, value: CustomValue) => {
    setCustomValues((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async () => {
    if (disabled || !tipo) return;
    setPhase('submitting');
    setError(null);
    try {
      const extraFields: Record<string, CustomValue> = {};
      for (const field of customFields) {
        const value = customValues[field.key];
        if (!isEmptyValue(value)) extraFields[field.key] = value;
      }
      const record = await createEntradaAction({
        placa: placa.trim(),
        tipo,
        extraFields: Object.keys(extraFields).length > 0 ? extraFields : undefined,
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
          setPhase('idle');
          setSuccessInfo(null);
          onRegistered();
        }, 800);
      }, 1200);
    } catch {
      setError('No se pudo registrar la entrada');
      setPhase('idle');
    }
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7, position: 'relative' }}>
          <label style={{ ...labelStyle, display: 'flex', alignItems: 'center', gap: 5 }}>
            <Star size={12} strokeWidth={2.4} fill="currentColor" />
            Buscar frecuente (opcional)
          </label>
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
              onChange={(event) => setFrequentQuery(event.target.value)}
              placeholder="Placa ya registrada antes…"
              className="ui-input"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                border: `1px solid ${colors.border}`,
                background: colors.bgInput,
                borderRadius: 10,
                padding: '12px 14px 12px 38px',
                font: 'inherit',
                fontSize: 14,
                outline: 'none',
                color: colors.textPrimary,
              }}
            />
          </div>

          {frequentQuery.trim() && (
            <div
              style={{
                border: `1px solid ${colors.border}`,
                background: colors.bgCard,
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              {frequentMatches.length === 0 ? (
                <div style={{ padding: '12px 14px', fontSize: 13, color: colors.textDim }}>
                  No se encontraron patentes frecuentes con esa placa.
                </div>
              ) : (
                frequentMatches.map((plate) => (
                  <button
                    key={plate.placa}
                    onClick={() => applyFrequent(plate)}
                    className="ui-btn"
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 10,
                      border: 'none',
                      borderBottom: `1px solid ${colors.border}`,
                      background: 'transparent',
                      cursor: 'pointer',
                      padding: '10px 14px',
                      font: 'inherit',
                      textAlign: 'left',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {plate.tipo === 'auto' ? (
                        <Car size={15} strokeWidth={2} />
                      ) : (
                        <Bike size={15} strokeWidth={2} />
                      )}
                      <span style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 14 }}>
                        {plate.placa}
                      </span>
                      <span style={{ fontSize: 12, color: colors.textDim }}>{tipoLabel(plate.tipo)}</span>
                    </span>
                    <span style={{ fontSize: 11, color: colors.textDim, whiteSpace: 'nowrap' }}>
                      {plate.visitCount} visitas
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>
      )}

      {fields.map((field) => {
        if (field.key === 'foto') return null;
        if (field.isSystem && field.key === 'placa') return renderPlaca();
        if (field.isSystem && field.key === 'tipo') return renderTipo();
        return renderCustom(field);
      })}

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
