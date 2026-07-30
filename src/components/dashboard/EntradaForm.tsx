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
  display: 'flex',
  alignItems: 'center',
  gap: 7,
  fontSize: 11,
  fontWeight: 700,
  color: colors.textMuted,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
};

const bulletStyle: React.CSSProperties = { width: 6, height: 6, background: colors.accent };

const customInputStyle: React.CSSProperties = {
  border: `1.5px solid ${colors.border}`,
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
    <div key="placa" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <label style={labelStyle}>
        <span style={bulletStyle} />
        Placa
      </label>
      <input
        value={placa}
        onChange={(event) => setPlaca(event.target.value.toUpperCase())}
        placeholder="ABC-123"
        style={{
          border: `2px dashed ${colors.borderDashed}`,
          background: colors.bgInput,
          borderRadius: 10,
          padding: '16px 18px',
          fontFamily: fonts.display,
          fontSize: 34,
          fontWeight: 800,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: colors.textPrimary,
          outline: 'none',
        }}
      />
    </div>
  );

  const renderTipo = () => (
    <div key="tipo" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <label style={labelStyle}>
        <span style={bulletStyle} />
        Tipo de vehículo
      </label>
      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => setTipo('auto')}
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            border: `1.5px solid ${tipo === 'auto' ? colors.cyanAuto : colors.border}`,
            background: tipo === 'auto' ? colors.cyanAutoBgSofter : colors.bgInputAlt,
            borderRadius: 12,
            padding: '16px 10px',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: tipo === 'auto' ? colors.cyanAuto : colors.cyanAutoBgSoft,
              color: tipo === 'auto' ? colors.accentContrast : colors.cyanAuto,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Car size={19} strokeWidth={1.8} />
          </span>
          <span
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: tipo === 'auto' ? colors.cyanAuto : colors.textPrimary,
            }}
          >
            Auto
          </span>
        </button>
        <button
          onClick={() => setTipo('moto')}
          style={{
            flex: 1,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 8,
            border: `1.5px solid ${tipo === 'moto' ? colors.pinkMoto : colors.border}`,
            background: tipo === 'moto' ? colors.pinkMotoBgSofter : colors.bgInputAlt,
            borderRadius: 12,
            padding: '16px 10px',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: 34,
              height: 34,
              borderRadius: 8,
              background: tipo === 'moto' ? colors.pinkMoto : colors.pinkMotoBgSoft,
              color: tipo === 'moto' ? colors.accentContrast : colors.pinkMoto,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Bike size={19} strokeWidth={1.8} />
          </span>
          <span
            style={{
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 14,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: tipo === 'moto' ? colors.pinkMoto : colors.textPrimary,
            }}
          >
            Moto
          </span>
        </button>
      </div>
    </div>
  );

  const renderFoto = () => (
    <div key="foto" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <label style={labelStyle}>
        <span style={bulletStyle} />
        Foto (opcional)
      </label>
      <PhotoDropzone onFileSelected={() => undefined} />
    </div>
  );

  const renderCustom = (field: FieldDefinition) => {
    const value = customValues[field.key];
    return (
      <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        <label style={labelStyle}>
          <span style={bulletStyle} />
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
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: 20,
        padding: 26,
        display: 'flex',
        flexDirection: 'column',
        gap: 20,
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
          padding: 16,
          borderRadius: 14,
          font: 'inherit',
          fontFamily: fonts.display,
          fontWeight: 800,
          fontSize: 17,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
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
                  Entrada registrada
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'rgba(247,248,250,0.65)' }}>
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
