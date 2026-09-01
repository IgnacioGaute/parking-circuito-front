'use client';

import { ArrowLeft, Delete } from 'lucide-react';
import { useRef, useState } from 'react';
import { colors, fonts } from '@/styles/theme';
import type { Operator } from '@/types';

interface PinPadProps {
  operator: Operator;
  onBack: () => void;
  onSuccess: (operator: Operator) => void;
}

const KEYPAD_LAYOUT = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'back'];

export function PinPad({ operator, onBack, onSuccess }: PinPadProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const errorTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const submit = async (fullPin: string) => {
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ operatorId: operator.id, pin: fullPin }),
      });

      if (!response.ok) {
        setError(true);
        setShake(true);
        clearTimeout(errorTimer.current);
        errorTimer.current = setTimeout(() => {
          setPin('');
          setShake(false);
        }, 550);
        return;
      }

      onSuccess(operator);
    } catch {
      setError(true);
      setShake(true);
      clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => {
        setPin('');
        setShake(false);
      }, 550);
    } finally {
      setSubmitting(false);
    }
  };

  const press = (digit: string) => {
    if (pin.length >= 4 || submitting) return;
    const next = pin + digit;
    setPin(next);
    setError(false);
    if (next.length === 4) {
      setTimeout(() => submit(next), 150);
    }
  };

  const backspace = () => {
    setPin((current) => current.slice(0, -1));
    setError(false);
  };

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 22,
        animation: 'fadeUp .25s both',
      }}
    >
      <button
        onClick={onBack}
        className="ui-btn ui-ghost"
        style={{
          alignSelf: 'flex-start',
          border: `1px solid ${colors.border}`,
          background: 'transparent',
          color: colors.textDim,
          cursor: 'pointer',
          font: 'inherit',
          fontSize: 12.5,
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 12px',
          borderRadius: 9,
        }}
      >
        <ArrowLeft size={13} strokeWidth={2.4} />
        Cambiar turno
      </button>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          justifyContent: 'center',
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
            fontSize: 14,
          }}
        >
          {operator.initials}
        </span>
        <span style={{ fontWeight: 800, fontSize: 19, letterSpacing: '-0.02em' }}>
          {operator.name}
        </span>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          alignItems: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: 16,
            animation: shake ? 'shake .5s' : 'none',
          }}
        >
          {[0, 1, 2, 3].map((i) => {
            const filled = i < pin.length;
            return (
              <div
                key={i}
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: '50%',
                  background: filled ? colors.accent : 'transparent',
                  border: filled ? 'none' : `1.5px solid ${colors.borderDashed}`,
                  transition: 'background 0.1s ease, border-color 0.1s ease',
                  boxShadow: filled ? `0 0 8px ${colors.accentBgSoft}` : 'none',
                }}
              />
            );
          })}
        </div>
        {error ? (
          <div style={{ fontSize: 12, color: colors.error, fontWeight: 600 }}>
            PIN incorrecto — intentá de nuevo
          </div>
        ) : (
          <div style={{ fontSize: 12, color: colors.textDim, fontWeight: 600 }}>
            PIN de prueba: 1234
          </div>
        )}
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3,1fr)',
          gap: 10,
        }}
      >
        {KEYPAD_LAYOUT.map((label, index) => {
          const isEmpty = label === '';
          const isBack = label === 'back';
          return (
            <button
              key={`${label || 'empty'}-${index}`}
              disabled={isEmpty || submitting}
              onClick={isEmpty ? undefined : isBack ? backspace : () => press(label)}
              className={isEmpty ? undefined : 'ui-btn ui-pinkey'}
              style={{
                border: `1px solid ${colors.border}`,
                background: colors.bgInput,
                color: colors.textPrimary,
                borderRadius: 14,
                padding: '18px 0',
                fontFamily: fonts.mono,
                fontSize: 21,
                fontWeight: 600,
                cursor: isEmpty ? 'default' : 'pointer',
                visibility: isEmpty ? 'hidden' : 'visible',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 58,
              }}
            >
              {isBack ? <Delete size={20} strokeWidth={2} /> : label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
