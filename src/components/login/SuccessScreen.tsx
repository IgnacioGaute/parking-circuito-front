'use client';

import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { colors } from '@/styles/theme';
import type { Operator } from '@/types';

interface SuccessScreenProps {
  operator: Operator;
}

export function SuccessScreen({ operator }: SuccessScreenProps) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        padding: '12px 0 4px',
        animation: 'fadeUp .3s both',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          background: colors.greenBgSoft,
          color: colors.green,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Check size={28} strokeWidth={2.6} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontWeight: 700, fontSize: 18 }}>Turno iniciado</div>
        <div style={{ fontSize: 12.5, color: colors.textMuted, marginTop: 6 }}>
          {operator.name} · acceso concedido
        </div>
      </div>
      <Link
        href="/"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          textAlign: 'center',
          textDecoration: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 15,
          borderRadius: 12,
          fontWeight: 700,
          fontSize: 15,
          background: colors.accent,
          color: colors.accentContrast,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        Continuar
        <ArrowRight size={17} strokeWidth={2.4} />
      </Link>
    </div>
  );
}
