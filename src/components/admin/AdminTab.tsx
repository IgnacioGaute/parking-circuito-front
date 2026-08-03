'use client';

import { useState } from 'react';
import { colors } from '@/styles/theme';
import { FieldDefinitionsAdminPanel } from './FieldDefinitionsAdminPanel';
import { OperatorsAdminPanel } from './OperatorsAdminPanel';

type Section = 'operadores' | 'campos';

interface AdminTabProps {
  currentOperatorId: string | null;
  onToast: (message: string) => void;
  // Lets the guided tour drive which sub-section is shown; normal clicks
  // still work through local state when this isn't set.
  forcedSection?: Section;
}

export function AdminTab({ currentOperatorId, onToast, forcedSection }: AdminTabProps) {
  const [section, setSection] = useState<Section>('operadores');

  // Adjusted during render rather than in an effect (React's documented
  // pattern for "sync state to a changed prop") to avoid an extra
  // cascading render.
  const [appliedForcedSection, setAppliedForcedSection] = useState(forcedSection);
  if (forcedSection !== appliedForcedSection) {
    setAppliedForcedSection(forcedSection);
    if (forcedSection) setSection(forcedSection);
  }

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
