'use client';

import { useState } from 'react';
import { colors, fonts } from '@/styles/theme';
import { FieldDefinitionsAdminPanel } from './FieldDefinitionsAdminPanel';
import { OperatorsAdminPanel } from './OperatorsAdminPanel';

type Section = 'operadores' | 'campos';

interface AdminTabProps {
  currentOperatorId: string | null;
  onToast: (message: string) => void;
}

export function AdminTab({ currentOperatorId, onToast }: AdminTabProps) {
  const [section, setSection] = useState<Section>('operadores');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp .3s both' }}>
      <div style={{ display: 'flex', gap: 2, borderBottom: `1px solid ${colors.border}` }}>
        <button
          onClick={() => setSection('operadores')}
          style={{
            padding: '10px 22px',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 15,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: 'transparent',
            color: section === 'operadores' ? colors.accentText : colors.textDim,
            borderBottom: section === 'operadores' ? `3px solid ${colors.accent}` : '3px solid transparent',
          }}
        >
          Operadores
        </button>
        <button
          onClick={() => setSection('campos')}
          style={{
            padding: '10px 22px',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 15,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
            background: 'transparent',
            color: section === 'campos' ? colors.accentText : colors.textDim,
            borderBottom: section === 'campos' ? `3px solid ${colors.accent}` : '3px solid transparent',
          }}
        >
          Campos de registro
        </button>
      </div>

      {section === 'operadores' ? (
        <OperatorsAdminPanel currentOperatorId={currentOperatorId} onToast={onToast} />
      ) : (
        <FieldDefinitionsAdminPanel onToast={onToast} />
      )}
    </div>
  );
}
