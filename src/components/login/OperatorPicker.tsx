'use client';

import { ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getOperatorsAction } from '@/actions/operators.actions';
import { useStaggerReveal } from '@/lib/use-stagger-reveal';
import { colors, fonts } from '@/styles/theme';
import type { Operator } from '@/types';

interface OperatorPickerProps {
  onSelect: (operator: Operator) => void;
}

export function OperatorPicker({ onSelect }: OperatorPickerProps) {
  const [operators, setOperators] = useState<Operator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const listRef = useStaggerReveal<HTMLDivElement>('.operator-option', operators.map((o) => o.id).join(','));

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div
        style={{
          fontSize: 10.5,
          fontWeight: 800,
          color: colors.textDim,
          textAlign: 'center',
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
        }}
      >
        Seleccioná tu turno
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: colors.textDimmer, fontSize: 13, padding: '12px 0' }}>
          Cargando operadores…
        </div>
      )}
      {error && (
        <div style={{ textAlign: 'center', color: colors.error, fontSize: 12.5 }}>{error}</div>
      )}

      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
        {operators.map((op) => (
          <button
            key={op.id}
            onClick={() => onSelect(op)}
            className="ui-btn ui-operator-btn operator-option"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 13,
              border: `1px solid ${colors.border}`,
              background: colors.bgCard,
              borderRadius: 14,
              padding: '13px 15px',
              cursor: 'pointer',
              font: 'inherit',
              textAlign: 'left',
              minHeight: 62,
            }}
          >
            <span
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: colors.accentBgSoft,
                color: colors.accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: fonts.mono,
                fontWeight: 700,
                fontSize: 13.5,
                flexShrink: 0,
              }}
            >
              {op.initials}
            </span>
            <span
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                gap: 3,
                minWidth: 0,
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: 15,
                  color: colors.textPrimary,
                  lineHeight: 1.2,
                }}
              >
                {op.name}
              </span>
              <span style={{ fontSize: 11.5, fontWeight: 600, color: colors.textDim, lineHeight: 1 }}>
                {op.role === 'admin' ? 'Admin' : 'Operador'}
              </span>
            </span>
            <ChevronRight
              size={16}
              strokeWidth={2.4}
              style={{ color: colors.textDimmer, flexShrink: 0 }}
            />
          </button>
        ))}
      </div>
    </div>
  );
}
