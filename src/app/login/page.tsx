'use client';

import { useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoginBrand } from '@/components/login/LoginBrand';
import { OperatorPicker } from '@/components/login/OperatorPicker';
import { PinPad } from '@/components/login/PinPad';
import { SuccessScreen } from '@/components/login/SuccessScreen';
import { saveActiveOperator } from '@/lib/active-operator';
import { colors, gridBackground } from '@/styles/theme';
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
        ...gridBackground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -180,
          left: -140,
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(246,167,35,0.14),transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -160,
          right: -120,
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(53,198,217,0.08),transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <ThemeToggle style={{ position: 'absolute', top: 20, right: 20, zIndex: 2 }} />

      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: colors.bgHeader,
          border: `1px solid ${colors.border}`,
          borderRadius: 22,
          boxShadow: `0 20px 60px ${colors.shadow}`,
          position: 'relative',
          zIndex: 1,
          animation: 'fadeUpLg .45s both',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 7,
            background: `repeating-linear-gradient(-45deg,${colors.accent} 0 14px,${colors.bgHeader} 14px 28px)`,
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
