'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoginBrand } from '@/components/login/LoginBrand';
import { OperatorPicker } from '@/components/login/OperatorPicker';
import { PinPad } from '@/components/login/PinPad';
import { SuccessScreen } from '@/components/login/SuccessScreen';
import { saveActiveOperator } from '@/lib/active-operator';
import { colors, screenBackground } from '@/styles/theme';
import type { Operator } from '@/types';

type Stage = 'operators' | 'pin' | 'success';

export default function LoginPage() {
  const [stage, setStage] = useState<Stage>('operators');
  const [selectedOperator, setSelectedOperator] = useState<Operator | null>(null);

  const handleSelect = (operator: Operator) => {
    setSelectedOperator(operator);
    setStage('pin');
  };

  const handleSuccess = (operator: Operator) => {
    saveActiveOperator(operator);
    setStage('success');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: colors.bg,
        ...screenBackground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'hidden',
      }}
    >
      <ThemeToggle style={{ position: 'absolute', top: 20, right: 20, zIndex: 2 }} />

      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          boxShadow: `0 20px 60px ${colors.shadow}`,
          position: 'relative',
          zIndex: 1,
          animation: 'fadeUpLg .45s both',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 4,
            background: colors.accent,
          }}
        />

        <div
          style={{
            padding: '34px 32px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
          }}
        >
          <LoginBrand />

          {stage === 'operators' && <OperatorPicker onSelect={handleSelect} />}

          {stage === 'pin' && selectedOperator && (
            <PinPad
              operator={selectedOperator}
              onBack={() => setStage('operators')}
              onSuccess={handleSuccess}
            />
          )}

          {stage === 'success' && selectedOperator && (
            <SuccessScreen operator={selectedOperator} />
          )}
        </div>
      </div>
    </div>
  );
}
