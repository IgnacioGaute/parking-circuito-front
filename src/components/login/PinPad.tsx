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
        style={{
          alignSelf: 'flex-start',
          border: 'none',
          background: 'transparent',
          color: colors.textDim,
          cursor: 'pointer',
          font: 'inherit',
          fontSize: 12,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: 0,
        }}
      >
        <ArrowLeft size={14} strokeWidth={2.2} />
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
            width: 38,
            height: 38,
            borderRadius: 8,
            background: colors.accentBgSofter,
            color: colors.accentText,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize: 16,
          }}
        >
          {operator.initials}
        </span>
        <span
          style={{
            fontFamily: fonts.display,
            fontWeight: 700,
            fontSize: 19,
            textTransform: 'uppercase',
            letterSpacing: '0.02em',
          }}
        >
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
            gap: 14,
            animation: shake ? 'shake .5s' : 'none',
          }}
        >
          {[0, 1, 2, 3].map((i) => {
            const filled = i < pin.length;
            return (
              <div
                key={i}
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${error ? colors.error : filled ? colors.accent : colors.borderDashed}`,
                  background: filled ? colors.accent : 'transparent',
                }}
              />
            );
          })}
        </div>
        {error ? (
          <div
            style={{
              fontSize: 12,
              color: colors.error,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
            PIN incorrecto — intenta de nuevo
          </div>
        ) : (
          <div
            style={{
              fontSize: 11,
              color: colors.textDimmer,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
            }}
          >
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
              style={{
                border: `1.5px solid ${colors.border}`,
                background: colors.bgInput,
                color: colors.textPrimary,
                borderRadius: 12,
                padding: '16px 0',
                fontFamily: fonts.display,
                fontSize: 22,
                fontWeight: 700,
                cursor: isEmpty ? 'default' : 'pointer',
                visibility: isEmpty ? 'hidden' : 'visible',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
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
