'use client';

import { Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  createOperatorAction,
  deleteOperatorAction,
  getOperatorsAction,
  updateOperatorAction,
} from '@/actions/operators.actions';
import { LoadingSquares } from '@/components/ui/LoadingSquares';
import { colors, fonts } from '@/styles/theme';
import type { Operator, Role } from '@/types';

interface AdminPanelProps {
  currentOperatorId: string | null;
  onToast: (message: string) => void;
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  background: colors.bgInput,
  borderRadius: 10,
  padding: '11px 14px',
  font: 'inherit',
  fontSize: 16,
  color: colors.textPrimary,
  outline: 'none',
};

const iconButtonStyle: React.CSSProperties = {
  width: 34,
  height: 34,
  border: `1px solid ${colors.border}`,
  background: 'transparent',
  color: colors.textPrimary,
  cursor: 'pointer',
  borderRadius: 9,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
};

const smallButtonStyle: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  background: 'transparent',
  color: colors.textPrimary,
  cursor: 'pointer',
  padding: '8px 14px',
  borderRadius: 9,
  font: 'inherit',
  fontWeight: 600,
  fontSize: 13,
};

export function OperatorsAdminPanel({ currentOperatorId, onToast }: AdminPanelProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [newName, setNewName] = useState('');
  const [newPin, setNewPin] = useState('');
  const [newRole, setNewRole] = useState<Role>('user');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const load = () => {
    getOperatorsAction()
      .then(setOperators)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const resetCreateForm = () => {
    setNewName('');
    setNewPin('');
    setNewRole('user');
    setCreateError(null);
    setShowCreateForm(false);
  };

  const handleCreate = async () => {
    if (!newName.trim() || newPin.length !== 4) return;
    setCreating(true);
    setCreateError(null);
    try {
      await createOperatorAction({ name: newName.trim(), pin: newPin, role: newRole });
      resetCreateForm();
      onToast('Operador creado');
      load();
    } catch {
      setCreateError('No se pudo crear el operador');
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (operator: Operator) => {
    try {
      await deleteOperatorAction(operator.id);
      onToast(`Operador eliminado: ${operator.name}`);
      load();
    } catch {
      onToast('No se pudo eliminar (¿es el único admin?)');
    }
  };

  return (
    <div data-tour="admin-operadores" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {showCreateForm ? (
        <>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Crear operador</div>
          <div
            style={{
              background: colors.bgCard,
              border: `1px solid ${colors.accent}`,
              borderRadius: 14,
              padding: 18,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            <input
              value={newName}
              onChange={(event) => setNewName(event.target.value)}
              placeholder="Nombre"
              aria-label="Nombre"
              style={{ ...inputStyle, flex: 2, minWidth: 160 }}
              autoFocus
            />
            <input
              value={newPin}
              onChange={(event) =>
                setNewPin(event.target.value.replace(/\D/g, '').slice(0, 4))
              }
              placeholder="PIN (4 dígitos)"
              aria-label="PIN (4 dígitos)"
              style={{ ...inputStyle, flex: 1, minWidth: 120 }}
            />
            <select
              value={newRole}
              onChange={(event) => setNewRole(event.target.value as Role)}
              aria-label="Rol"
              style={{ ...inputStyle, flex: 1, minWidth: 120, cursor: 'pointer' }}
            >
              <option value="user">Usuario</option>
              <option value="admin">Admin</option>
            </select>
            <button
              onClick={handleCreate}
              disabled={creating || !newName.trim() || newPin.length !== 4}
              style={{
                border: 'none',
                background:
                  !newName.trim() || newPin.length !== 4
                    ? colors.accentDisabledBg
                    : colors.accent,
                color: colors.accentContrast,
                cursor: 'pointer',
                padding: '11px 20px',
                borderRadius: 10,
                font: 'inherit',
                fontWeight: 700,
                fontSize: 14,
                opacity: creating ? 0.7 : 1,
              }}
            >
              {creating ? 'Creando…' : 'Crear'}
            </button>
            <button onClick={resetCreateForm} style={smallButtonStyle}>
              Cancelar
            </button>
            {createError && (
              <div style={{ width: '100%', color: colors.error, fontSize: 12.5 }}>
                {createError}
              </div>
            )}
          </div>
        </>
      ) : (
        <button
          onClick={() => setShowCreateForm(true)}
          style={{
            border: `1px dashed ${colors.borderDashed}`,
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
            fontWeight: 600,
            fontSize: 13.5,
            textAlign: 'center',
          }}
        >
          <Plus size={15} strokeWidth={2} />
          Crear operador
        </button>
      )}

      <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>Operadores</div>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <LoadingSquares />
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {operators.map((operator) =>
          editingId === operator.id ? (
            <OperatorEditRow
              key={operator.id}
              operator={operator}
              onCancel={() => setEditingId(null)}
              onSaved={() => {
                setEditingId(null);
                onToast(`Operador actualizado: ${operator.name}`);
                load();
              }}
              onError={() => onToast('No se pudo actualizar (¿es el único admin?)')}
            />
          ) : (
            <div
              key={operator.id}
              style={{
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: '14px 18px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: operator.role === 'admin' ? colors.accent : colors.accentBgSoft,
                  color: operator.role === 'admin' ? colors.accentContrast : colors.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fonts.mono,
                  fontWeight: 600,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {operator.initials}
              </span>
              <div style={{ flex: 1, minWidth: 140 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>
                  {operator.name}
                  {operator.id === currentOperatorId && (
                    <span style={{ color: colors.textDim, fontWeight: 400 }}> (vos)</span>
                  )}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: operator.role === 'admin' ? colors.accent : colors.textDim,
                    marginTop: 3,
                  }}
                >
                  {operator.role === 'admin' ? 'Administrador' : 'Operador'}
                </div>
              </div>
              <button
                style={iconButtonStyle}
                aria-label="Editar operador"
                title="Editar"
                onClick={() => setEditingId(operator.id)}
              >
                <Pencil size={15} strokeWidth={2} />
              </button>
              <button
                style={{ ...iconButtonStyle, color: colors.error, borderColor: colors.error }}
                aria-label="Eliminar operador"
                title="Eliminar"
                onClick={() => handleDelete(operator)}
              >
                <Trash2 size={15} strokeWidth={2} />
              </button>
            </div>
          ),
        )}
      </div>
    </div>
  );
}

interface OperatorEditRowProps {
  operator: Operator;
  onCancel: () => void;
  onSaved: () => void;
  onError: () => void;
}

function OperatorEditRow({ operator, onCancel, onSaved, onError }: OperatorEditRowProps) {
  const [name, setName] = useState(operator.name);
  const [role, setRole] = useState<Role>(operator.role);
  const [pin, setPin] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateOperatorAction(operator.id, {
        name: name.trim() || undefined,
        role,
        pin: pin.length === 4 ? pin : undefined,
      });
      onSaved();
    } catch {
      onError();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.accent}`,
        borderRadius: 14,
        padding: 18,
        display: 'flex',
        gap: 10,
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <input
        value={name}
        onChange={(event) => setName(event.target.value)}
        aria-label="Nombre"
        style={{ ...inputStyle, flex: 2, minWidth: 140 }}
      />
      <input
        value={pin}
        onChange={(event) => setPin(event.target.value.replace(/\D/g, '').slice(0, 4))}
        placeholder="Nuevo PIN (opcional)"
        aria-label="Nuevo PIN (opcional)"
        style={{ ...inputStyle, flex: 1, minWidth: 150 }}
      />
      <select
        value={role}
        onChange={(event) => setRole(event.target.value as Role)}
        aria-label="Rol"
        style={{ ...inputStyle, flex: 1, minWidth: 120, cursor: 'pointer' }}
      >
        <option value="user">Usuario</option>
        <option value="admin">Admin</option>
      </select>
      <button
        onClick={handleSave}
        disabled={saving}
        style={{
          border: 'none',
          background: colors.accent,
          color: colors.accentContrast,
          cursor: 'pointer',
          padding: '10px 18px',
          borderRadius: 10,
          font: 'inherit',
          fontWeight: 700,
          fontSize: 13.5,
          opacity: saving ? 0.7 : 1,
        }}
      >
        Guardar
      </button>
      <button onClick={onCancel} style={smallButtonStyle}>
        Cancelar
      </button>
    </div>
  );
}
