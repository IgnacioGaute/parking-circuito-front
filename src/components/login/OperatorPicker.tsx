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
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: colors.textDim,
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          textAlign: 'center',
        }}
      >
        Selecciona tu turno
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
              border: `1.5px solid ${colors.border}`,
              background: colors.bgInput,
              borderRadius: 12,
              padding: '13px 16px',
              cursor: 'pointer',
              font: 'inherit',
              textAlign: 'left',
            }}
          >
            <span
              style={{
                width: 34,
                height: 34,
                borderRadius: 8,
                background: colors.accentBgSofter,
                color: colors.accentText,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fonts.display,
                fontWeight: 800,
                fontSize: 15,
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
