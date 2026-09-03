'use client';

import { X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { getActiveFieldDefinitionsAction } from '@/actions/field-definitions.actions';
import { updateRecordAction } from '@/actions/parking-records.actions';
import { colors, fonts } from '@/styles/theme';
import type { FieldDefinition, ParkingRecord, VehicleType } from '@/types';
import { VehicleIcon } from './record-display-utils';

// Narrow shape so this modal can edit either a full ParkingRecord (from
// Dentro/Historial) or a FrequentPlate (from Frecuentes) without needing to
// fetch a full record first — both types satisfy this structurally.
export interface EditableRecord {
  id: string;
  placa: string;
  tipo: VehicleType;
  extraFields: Record<string, unknown> | null;
}

type CustomValue = string | number | boolean;

const labelStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: colors.textMuted,
};

const inputStyle: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  background: colors.bgInput,
  borderRadius: 10,
  padding: '13px 15px',
  font: 'inherit',
  fontSize: 16,
  color: colors.textPrimary,
  outline: 'none',
};

function isEmptyValue(value: CustomValue | undefined): boolean {
  return value === undefined || value === null || value === '';
}

interface EditRecordModalProps {
  record: EditableRecord;
  onSaved: (updated: ParkingRecord) => void;
  onCancel: () => void;
}

export function EditRecordModal({ record, onSaved, onCancel }: EditRecordModalProps) {
  const [placa, setPlaca] = useState(record.placa);
  const [tipo, setTipo] = useState<VehicleType>(record.tipo);
  const [customFields, setCustomFields] = useState<FieldDefinition[]>([]);
  const [customValues, setCustomValues] = useState<Record<string, CustomValue>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getActiveFieldDefinitionsAction()
      .then((result) => {
        const fields = result.filter(
          (f) => f.key !== 'placa' && f.key !== 'tipo' && f.key !== 'foto',
        );
        setCustomFields(fields);
        const initial: Record<string, CustomValue> = {};
        for (const field of fields) {
          const value = record.extraFields?.[field.key];
          if (value !== undefined && value !== null) {
            initial[field.key] = value as CustomValue;
          }
        }
        setCustomValues(initial);
      })
      .catch(() => undefined);
  }, [record.extraFields]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, busy]);

  const setCustomValue = (key: string, value: CustomValue) => {
    setCustomValues((current) => ({ ...current, [key]: value }));
  };

  const disabled =
    busy ||
    !placa.trim() ||
    customFields.some((f) => f.required && isEmptyValue(customValues[f.key]));

  const handleSave = async () => {
    if (disabled) return;
    setBusy(true);
    setError(null);
    try {
      const extraFields: Record<string, CustomValue> = {};
      for (const field of customFields) {
        const value = customValues[field.key];
        if (!isEmptyValue(value)) extraFields[field.key] = value;
      }
      const updated = await updateRecordAction(record.id, {
        placa: placa.trim(),
        tipo,
        extraFields,
      });
      onSaved(updated);
    } catch {
      setError('No se pudo editar el registro');
      setBusy(false);
    }
  };

  const renderCustom = (field: FieldDefinition) => {
    const value = customValues[field.key];
    const fieldId = `edit-record-field-${field.id}`;
    return (
      <div key={field.id} style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        <label htmlFor={fieldId} style={labelStyle}>
          {field.label}
          {field.required ? '' : ' (opcional)'}
        </label>
        {field.type === 'select' ? (
          <select
            id={fieldId}
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setCustomValue(field.key, event.target.value)}
            style={{ ...inputStyle, cursor: 'pointer' }}
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
            htmlFor={fieldId}
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
              id={fieldId}
              type="checkbox"
              checked={value === true}
              onChange={(event) => setCustomValue(field.key, event.target.checked)}
            />
            Sí
          </label>
        ) : field.type === 'number' ? (
          <input
            id={fieldId}
            type="number"
            value={typeof value === 'number' ? value : ''}
            onChange={(event) =>
              setCustomValue(
                field.key,
                event.target.value === '' ? '' : Number(event.target.value),
              )
            }
            style={inputStyle}
          />
        ) : (
          <input
            id={fieldId}
            type="text"
            value={typeof value === 'string' ? value : ''}
            onChange={(event) => setCustomValue(field.key, event.target.value)}
            style={inputStyle}
          />
        )}
      </div>
    );
  };

  // 'use client' components still render on the server for the initial
  // HTML, where `document` doesn't exist — createPortal(..., document.body)
  // would throw there.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        onClick={busy ? undefined : onCancel}
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
          maxHeight: '80vh',
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, fontWeight: 700, fontSize: 17 }}>
            <VehicleIcon tipo={record.tipo} size={18} />
            Editar registro
          </div>
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
            minHeight: 0,
            overflowY: 'auto',
            padding: '8px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <label htmlFor="edit-record-placa" style={labelStyle}>Placa</label>
              <input
                id="edit-record-placa"
                value={placa}
                onChange={(event) => setPlaca(event.target.value.toUpperCase())}
                className="ui-input"
                style={{
                  ...inputStyle,
                  fontFamily: fonts.mono,
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '0.03em',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div style={labelStyle}>Tipo de vehículo</div>
              <div
                role="group"
                aria-label="Tipo de vehículo"
                style={{ display: 'flex', border: `1px solid ${colors.border}`, borderRadius: 12, overflow: 'hidden' }}
              >
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
                  Moto
                </button>
              </div>
            </div>

            {customFields.map(renderCustom)}

            {error && (
              <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.error, textAlign: 'center' }}>
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
              onClick={handleSave}
              disabled={disabled}
              style={{
                flex: 2,
                border: 'none',
                background: disabled ? colors.accentDisabledBg : colors.accent,
                color: colors.accentContrast,
                cursor: disabled ? 'default' : 'pointer',
                padding: 15,
                borderRadius: 12,
                font: 'inherit',
                fontWeight: 700,
                fontSize: 14,
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
