'use client';

import { Bike, Car } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getActiveFieldDefinitionsAction } from '@/actions/field-definitions.actions';
import { createEntradaAction } from '@/actions/parking-records.actions';
import { colors, fonts } from '@/styles/theme';
import type { FieldDefinition, VehicleType } from '@/types';
import { PhotoDropzone } from './PhotoDropzone';

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
  {
    id: 'sys-foto',
    key: 'foto',
    label: 'Foto',
    type: 'text',
    required: false,
    options: null,
    sortOrder: 2,
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

  useEffect(() => {
    getActiveFieldDefinitionsAction()
      .then((result) => setFields([...result].sort((a, b) => a.sortOrder - b.sortOrder)))
      .catch(() => undefined);
  }, []);

  const customFields = fields.filter((f) => !f.isSystem);
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
          }}
        >
          <Car size={17} strokeWidth={2} />
          Auto
        </button>
        <button
          onClick={() => setTipo('moto')}
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
          }}
        >
          <Bike size={17} strokeWidth={2} />
          Moto
        </button>
      </div>
    </div>
  );

  const renderFoto = () => (
    <div key="foto" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      <label style={labelStyle}>Foto (opcional)</label>
      <PhotoDropzone onFileSelected={() => undefined} />
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
      {fields.map((field) => {
        if (field.isSystem && field.key === 'placa') return renderPlaca();
        if (field.isSystem && field.key === 'tipo') return renderTipo();
        if (field.isSystem && field.key === 'foto') return renderFoto();
        if (!field.isSystem) return renderCustom(field);
        return null;
      })}

      {error && (
        <div style={{ fontSize: 12.5, color: colors.error, fontWeight: 600 }}>{error}</div>
      )}

      <button
        onClick={handleSubmit}
        disabled={disabled}
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
