'use client';

import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import { colors, fonts } from '@/styles/theme';
import { prefersReducedMotion, sequentialOpacity } from './chart-utils';

export interface RankedBarRow {
  key: string;
  label: string;
  value: number;
}

interface RankedBarChartProps {
  rows: RankedBarRow[];
  valueFormat?: (n: number) => string;
  emptyMessage: string;
  ariaLabel: string;
  // Plates read as codes (monospace fits their fixed-width shape); operator
  // names are prose and read better in the body font, which is also more
  // compact per character so longer names have a better shot at fitting.
  monospaceLabels?: boolean;
}

// Horizontal magnitude bars — one hue (the app's own accent), darker at the
// top rank and stepping down, per dataviz's "compare magnitude -> sequential"
// rule. Grows via scaleX from a left origin (hyperframes-animation
// stat-bars-and-fills progress-fill recipe), not a width tween.
export function RankedBarChart({
  rows,
  valueFormat = (n) => n.toLocaleString('es'),
  emptyMessage,
  ariaLabel,
  monospaceLabels = true,
}: RankedBarChartProps) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const fillRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const signature = rows.map((r) => `${r.key}:${r.value}`).join('|');

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline();
    rows.forEach((row, i) => {
      const el = fillRefs.current[row.key];
      if (!el) return;
      if (reduced) {
        gsap.set(el, { scaleX: 1 });
        return;
      }
      gsap.set(el, { scaleX: 0 });
      tl.to(el, { scaleX: 1, duration: 0.7, ease: 'power3.out' }, i * 0.06);
    });
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  if (rows.length === 0) {
    return (
      <div style={{ padding: '28px 0', textAlign: 'center', color: colors.textDim, fontSize: 12.5 }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div role="img" aria-label={ariaLabel} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {rows.map((row, i) => (
        <div key={row.key} style={{ display: 'grid', gridTemplateColumns: '128px 1fr 44px', alignItems: 'center', gap: 10 }}>
          <span
            style={{
              fontSize: monospaceLabels ? 12 : 12.5,
              fontWeight: 600,
              color: colors.textMuted,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontFamily: monospaceLabels ? fonts.mono : fonts.body,
            }}
            title={row.label}
          >
            {row.label}
          </span>
          <div style={{ height: 14, borderRadius: 7, background: colors.bgInputAlt, overflow: 'hidden', position: 'relative' }}>
            <div
              ref={(el) => { fillRefs.current[row.key] = el; }}
              style={{
                width: `${Math.max(3, (row.value / max) * 100)}%`,
                height: '100%',
                borderRadius: 7,
                background: colors.accent,
                opacity: sequentialOpacity(i, rows.length),
                transformOrigin: 'left center',
              }}
            />
          </div>
          <span style={{ fontSize: 12, fontWeight: 700, color: colors.textPrimary, textAlign: 'right', fontFamily: fonts.mono }}>
            {valueFormat(row.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
