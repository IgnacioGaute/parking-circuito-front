'use client';

import { useEffect, useState } from 'react';
import { getOperatorsAction } from '@/actions/operators.actions';
import { colors, fonts } from '@/styles/theme';
import type { Operator } from '@/types';

export function UsuariosTab() {
  const [operators, setOperators] = useState<Operator[]>([]);

  useEffect(() => {
    let cancelled = false;
    getOperatorsAction().then((result) => {
      if (!cancelled) setOperators(result);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp .3s both' }}>
      <div style={{ fontSize: 18, fontWeight: 700 }}>Registro de operadores</div>
      <div data-tour="usuarios-list" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {operators.map((op) => {
          const active = op.onDuty;
          return (
            <div
              key={op.id}
              style={{
                background: colors.bgCard,
                border: `1px solid ${active ? colors.accent : colors.border}`,
                borderRadius: 14,
                padding: '15px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <span
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: active ? colors.accent : colors.accentBgSoft,
                  color: active ? colors.accentContrast : colors.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: fonts.mono,
                  fontWeight: 600,
                  fontSize: 13,
                  flexShrink: 0,
                }}
              >
                {op.initials}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{op.name}</div>
                <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>Operador</div>
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: active ? colors.greenBgSoft : colors.bgInputAlt,
                  color: active ? colors.green : colors.textDim,
                  padding: '5px 12px',
                  borderRadius: 999,
                  fontSize: 11.5,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: active ? colors.green : colors.textDim,
                  }}
                />
                {active ? 'En turno' : 'Fuera de turno'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
