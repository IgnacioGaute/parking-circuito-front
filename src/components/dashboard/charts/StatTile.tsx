'use client';

import gsap from 'gsap';
import type { ComponentType } from 'react';
import { useEffect, useRef } from 'react';
import { colors, fonts } from '@/styles/theme';
import { prefersReducedMotion } from './chart-utils';

interface StatTileProps {
  label: string;
  value: number;
  format: (n: number) => string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  hint?: string;
}

// Label + hero-ish value (count-up) + icon. One accent per tile — the
// number is the only thing that moves; see hyperframes-animation
// counting-dynamic-scale for the count-up contract (O(1) onUpdate, no
// per-frame allocation).
export function StatTile({ label, value, format, Icon, hint }: StatTileProps) {
  const valueRef = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const el = valueRef.current;
    if (!el) return;
    const from = { n: prevValue.current };
    if (prefersReducedMotion()) {
      el.textContent = format(value);
      prevValue.current = value;
      return;
    }
    const tween = gsap.to(from, {
      n: value,
      duration: 0.9,
      ease: 'power3.out',
      onUpdate: () => {
        el.textContent = format(Math.round(from.n));
      },
    });
    prevValue.current = value;
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: 14,
        padding: '16px 18px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minWidth: 0,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>{label}</span>
        <span
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 28,
            height: 28,
            borderRadius: 8,
            background: colors.accentBgSoft,
            color: colors.accent,
            flexShrink: 0,
          }}
        >
          <Icon size={14} strokeWidth={2} />
        </span>
      </div>
      <span
        ref={valueRef}
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: colors.textPrimary,
          fontFamily: fonts.body,
          lineHeight: 1.1,
        }}
      >
        0
      </span>
      {hint && <span style={{ fontSize: 11, color: colors.textDim }}>{hint}</span>}
    </div>
  );
}
