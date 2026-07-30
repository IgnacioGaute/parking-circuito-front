'use client';

import { GripVertical, Lock, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  createFieldDefinitionAction,
  deleteFieldDefinitionAction,
  getFieldDefinitionsAction,
  updateFieldDefinitionAction,
} from '@/actions/field-definitions.actions';
import { colors, fonts } from '@/styles/theme';
import type { FieldDefinition, FieldType } from '@/types';

interface FieldDefinitionsAdminPanelProps {
  onToast: (message: string) => void;
}

const inputStyle: React.CSSProperties = {
  border: `1.5px solid ${colors.border}`,
  background: colors.bgInput,
  borderRadius: 10,
  padding: '11px 14px',
  font: 'inherit',
  fontSize: 14,
  color: colors.textPrimary,
  outline: 'none',
};

const TYPE_LABELS: Record<FieldType, string> = {
  text: 'Texto',
  number: 'Número',
  boolean: 'Sí / No',
  select: 'Lista',
};

const SYSTEM_HINTS: Record<string, string> = {
  placa: 'Texto libre',
  tipo: 'Auto / Moto',
  foto: 'Imagen (opcional)',
};

function fieldHint(field: FieldDefinition): string {
  if (field.isSystem && SYSTEM_HINTS[field.key]) return SYSTEM_HINTS[field.key];
  if (field.type === 'select' && field.options) return field.options.join(' / ');
  return TYPE_LABELS[field.type];
}

function keySlug(label: string): string {
  return label
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .replace(/^([0-9])/, '_$1');
}

export function FieldDefinitionsAdminPanel({ onToast }: FieldDefinitionsAdminPanelProps) {
  const [fields, setFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const rowRefs = useRef(new Map<string, HTMLDivElement>());

  const [label, setLabel] = useState('');
  const [type, setType] = useState<FieldType>('text');
  const [required, setRequired] = useState(false);
  const [optionsText, setOptionsText] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = () => {
    getFieldDefinitionsAction()
      .then((result) =>
        setFields(result.filter((f) => f.active).sort((a, b) => a.sortOrder - b.sortOrder)),
      )
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetCreateForm = () => {
    setLabel('');
    setType('text');
    setRequired(false);
    setOptionsText('');
    setCreateError(null);
    setShowCreateForm(false);
  };

  const handleCreate = async () => {
    if (!label.trim()) return;
    const options = optionsText
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
    if (type === 'select' && options.length === 0) {
      setCreateError('Agregá al menos una opción separada por comas');
      return;
    }
    setCreating(true);
    setCreateError(null);
    try {
      await createFieldDefinitionAction({
        key: keySlug(label),
        label: label.trim(),
        type,
        required,
        options: type === 'select' ? options : undefined,
        sortOrder: fields.length,
      });
      resetCreateForm();
      onToast('Campo agregado al formulario');
      load();
    } catch {
      setCreateError('No se pudo crear el campo (¿la key ya existe?)');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (field: FieldDefinition) => {
    try {
      await deleteFieldDefinitionAction(field.id);
      onToast(`Campo eliminado: ${field.label}`);
      load();
    } catch {
      onToast('No se pudo eliminar el campo');
    }
  };

  const persistOrder = (reordered: FieldDefinition[]) => {
    Promise.all(
      reordered.map((field, index) =>
        field.sortOrder === index
          ? Promise.resolve()
          : updateFieldDefinitionAction(field.id, { sortOrder: index }),
      ),
    ).catch(() => {
      onToast('No se pudo guardar el nuevo orden');
      load();
    });
  };

  // Pointer Events (not the HTML5 Drag and Drop API) so the same handle works
  // with touch — HTML5 DnD has no touch support on mobile browsers.
  const handlePointerDown = (event: React.PointerEvent<HTMLSpanElement>, fieldId: string) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDraggedId(fieldId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!draggedId) return;
    const { clientY } = event;
    let overId: string | null = null;
    for (const [id, el] of rowRefs.current) {
      if (id === draggedId) continue;
      const rect = el.getBoundingClientRect();
      if (clientY >= rect.top && clientY <= rect.bottom) {
        overId = id;
        break;
      }
    }
    if (!overId) return;
    setFields((current) => {
      const fromIndex = current.findIndex((f) => f.id === draggedId);
      const toIndex = current.findIndex((f) => f.id === overId);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return current;
      const reordered = [...current];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      return reordered;
    });
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLSpanElement>) => {
    if (!draggedId) return;
    event.currentTarget.releasePointerCapture(event.pointerId);
    setDraggedId(null);
    setFields((current) => {
      persistOrder(current);
      return current;
    });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div
          style={{
            fontFamily: fonts.display,
            fontSize: 18,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
          }}
        >
          Formulario de registrar entrada
        </div>
        <div style={{ fontSize: 12.5, color: colors.textDim, marginTop: 4 }}>
          Arrastrá cualquier campo para reordenarlo. Los fijos (placa, tipo, foto) no se
          pueden eliminar, pero sí mover de lugar.
        </div>
      </div>

      {loading && <div style={{ color: colors.textDimmer, fontSize: 13 }}>Cargando…</div>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {fields.map((field) => (
          <div
            key={field.id}
            ref={(el) => {
              if (el) rowRefs.current.set(field.id, el);
              else rowRefs.current.delete(field.id);
            }}
            style={{
              background: field.isSystem ? colors.bgHeader : colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              opacity: draggedId === field.id ? 0.6 : 1,
              boxShadow: draggedId === field.id ? `0 8px 20px ${colors.shadow}` : 'none',
            }}
          >
            <span
              onPointerDown={(event) => handlePointerDown(event, field.id)}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{
                display: 'flex',
                color: colors.textDimmer,
                width: 18,
                justifyContent: 'center',
                flexShrink: 0,
                touchAction: 'none',
                cursor: draggedId === field.id ? 'grabbing' : 'grab',
              }}
            >
              {field.isSystem ? (
                <Lock size={15} strokeWidth={1.8} />
              ) : (
                <GripVertical size={16} strokeWidth={1.8} />
              )}
            </span>
            <div style={{ flex: 1, minWidth: 160 }}>
              <div
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: colors.textPrimary,
                }}
              >
                {field.label}
                {field.required && !field.isSystem && (
                  <span style={{ color: colors.accentText }}> *</span>
                )}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: field.isSystem ? colors.textDimmer : colors.textDim,
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                  marginTop: 3,
                }}
              >
                {field.isSystem ? fieldHint(field) : `${field.key} · ${fieldHint(field)}`}
              </div>
            </div>
            {field.isSystem ? (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 700,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  color: colors.textDimmer,
                  border: `1px solid ${colors.border}`,
                  borderRadius: 999,
                  padding: '3px 10px',
                }}
              >
                Fijo
              </span>
            ) : (
              <button
                onClick={() => handleDelete(field)}
                aria-label="Eliminar campo"
                title="Eliminar"
                style={{
                  width: 34,
                  height: 34,
                  border: `1.5px solid ${colors.error}`,
                  background: 'transparent',
                  color: colors.error,
                  cursor: 'pointer',
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Trash2 size={15} strokeWidth={1.8} />
              </button>
            )}
          </div>
        ))}

        {showCreateForm ? (
          <div
            style={{
              background: colors.bgCard,
              border: `1px solid ${colors.accent}`,
              borderRadius: 14,
              padding: 18,
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                value={label}
                onChange={(event) => setLabel(event.target.value)}
                placeholder="Nombre del campo (ej: Color)"
                style={{ ...inputStyle, flex: 2, minWidth: 180 }}
                autoFocus
              />
              <select
                value={type}
                onChange={(event) => setType(event.target.value as FieldType)}
                style={{ ...inputStyle, flex: 1, minWidth: 130, cursor: 'pointer' }}
              >
                {(Object.keys(TYPE_LABELS) as FieldType[]).map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  fontSize: 13,
                  color: colors.textPrimary,
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={required}
                  onChange={(event) => setRequired(event.target.checked)}
                />
                Obligatorio
              </label>
            </div>
            {type === 'select' && (
              <input
                value={optionsText}
                onChange={(event) => setOptionsText(event.target.value)}
                placeholder="Opciones separadas por coma (ej: Rojo, Verde, Azul)"
                style={inputStyle}
              />
            )}
            {label.trim() && (
              <div style={{ fontSize: 11, color: colors.textDimmer }}>
                key: <code>{keySlug(label)}</code>
              </div>
            )}
            {createError && <div style={{ color: colors.error, fontSize: 12.5 }}>{createError}</div>}
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={handleCreate}
                disabled={creating || !label.trim()}
                style={{
                  border: 'none',
                  background: !label.trim() ? colors.accentDisabledBg : colors.accent,
                  color: colors.accentContrast,
                  cursor: 'pointer',
                  padding: '11px 20px',
                  borderRadius: 10,
                  font: 'inherit',
                  fontFamily: fonts.display,
                  fontWeight: 800,
                  fontSize: 13.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  opacity: creating ? 0.7 : 1,
                }}
              >
                {creating ? 'Agregando…' : 'Agregar al formulario'}
              </button>
              <button
                onClick={resetCreateForm}
                style={{
                  border: `1.5px solid ${colors.border}`,
                  background: 'transparent',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  padding: '11px 20px',
                  borderRadius: 10,
                  font: 'inherit',
                  fontFamily: fonts.display,
                  fontWeight: 700,
                  fontSize: 13.5,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowCreateForm(true)}
            style={{
              border: `1.5px dashed ${colors.border}`,
              background: 'transparent',
              color: colors.textMuted,
              cursor: 'pointer',
              padding: '14px 18px',
              borderRadius: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              font: 'inherit',
              fontFamily: fonts.display,
              fontWeight: 700,
              fontSize: 13.5,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              textAlign: 'center',
            }}
          >
            <Plus size={15} strokeWidth={2.2} />
            Agregar campo
          </button>
        )}
      </div>
    </div>
  );
}
