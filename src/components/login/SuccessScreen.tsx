'use client';

import gsap from 'gsap';
import { ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { useLayoutEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { colors } from '@/styles/theme';
import type { Operator } from '@/types';

interface SuccessScreenProps {
  operator: Operator;
}

export function SuccessScreen({ operator }: SuccessScreenProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);

  // Same badge-lands + ring-pulse language as the vehicle entry/exit
  // confirmation (SuccessOverlay) — one visual grammar for "this action
  // just succeeded" across the whole app, login included.
  useLayoutEffect(() => {
    const ring = ringRef.current;
    const badge = badgeRef.current;
    if (!ring || !badge || prefersReducedMotion()) return;
    gsap.set(badge, { scale: 0 });
    gsap.set(ring, { scale: 0.6, opacity: 0.55 });
    const tl = gsap.timeline();
    tl.to(badge, { scale: 1, duration: 0.5, ease: 'back.out(1.15)' }, 0).to(
      ring,
      { scale: 1.9, opacity: 0, duration: 0.75, ease: 'power2.out' },
      0,
    );
    return () => {
      tl.kill();
    };
  }, []);

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
      <div style={{ position: 'relative', width: 56, height: 56 }}>
        <div
          ref={ringRef}
          style={{ position: 'absolute', inset: 0, borderRadius: '50%', border: `2px solid ${colors.green}` }}
        />
        <div
          ref={badgeRef}
          style={{
            position: 'absolute',
            inset: 0,
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
