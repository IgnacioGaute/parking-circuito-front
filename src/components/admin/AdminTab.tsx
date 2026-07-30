'use client';

import { useState } from 'react';
import { colors } from '@/styles/theme';
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
            padding: '10px 20px',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontWeight: 600,
            fontSize: 14,
            background: 'transparent',
            color: section === 'operadores' ? colors.accent : colors.textDim,
            borderBottom: section === 'operadores' ? `2px solid ${colors.accent}` : '2px solid transparent',
          }}
        >
          Operadores
        </button>
        <button
          onClick={() => setSection('campos')}
          style={{
            padding: '10px 20px',
            border: 'none',
            cursor: 'pointer',
            font: 'inherit',
            fontWeight: 600,
            fontSize: 14,
            background: 'transparent',
            color: section === 'campos' ? colors.accent : colors.textDim,
            borderBottom: section === 'campos' ? `2px solid ${colors.accent}` : '2px solid transparent',
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
