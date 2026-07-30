'use client';

import { useEffect, useState } from 'react';
import { getOperatorsAction } from '@/actions/operators.actions';
import { colors, fonts } from '@/styles/theme';
import type { Operator } from '@/types';

interface OperatorPickerProps {
  onSelect: (operator: Operator) => void;
}

export function OperatorPicker({ onSelect }: OperatorPickerProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOperatorsAction()
      .then((result) => {
        if (!cancelled) setOperators(result);
      })
      .catch(() => {
        if (!cancelled) setError('No se pudieron cargar los operadores');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, textAlign: 'center' }}>
        Seleccioná tu turno
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: colors.textDimmer, fontSize: 13 }}>
          Cargando operadores…
        </div>
      )}
      {error && (
        <div style={{ textAlign: 'center', color: colors.error, fontSize: 12.5 }}>
          {error}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {operators.map((op) => (
          <button
            key={op.id}
            onClick={() => onSelect(op)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: `1px solid ${colors.border}`,
              background: colors.bgCard,
              borderRadius: 12,
              padding: '13px 16px',
              cursor: 'pointer',
              font: 'inherit',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                border: `1px solid ${colors.borderDashed}`,
                color: colors.textMuted,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fonts.mono,
                fontWeight: 600,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {op.initials}
            </span>
            <span style={{ fontWeight: 600, fontSize: 14.5, color: colors.textPrimary }}>
              {op.name}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
