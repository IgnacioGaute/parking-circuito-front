'use client';

import gsap from 'gsap';
import { useLayoutEffect, useRef, useState } from 'react';
import { colors, fonts } from '@/styles/theme';
import { ChartTooltip, type TooltipRow } from './ChartTooltip';
import { prefersReducedMotion } from './chart-utils';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  slices: DonutSlice[];
  centerLabel: string;
  ariaLabel: string;
}

const SIZE = 200;
const R = 74;
const STROKE = 26;
const CIRCUMFERENCE = 2 * Math.PI * R;
const CENTER = SIZE / 2;

// Two-slice donut (vehicle mix). Each arc grows from its own start angle
// via a dasharray-length tween — the arc equivalent of the progress-fill
// recipe in hyperframes-animation/rules/stat-bars-and-fills.md, staggered
// so the second slice draws in right behind the first.
export function DonutChart({ slices, centerLabel, ariaLabel }: DonutChartProps) {
  const total = slices.reduce((sum, s) => sum + s.value, 0) || 1;
  const circleRefs = useRef<Record<string, SVGCircleElement | null>>({});
  const signature = slices.map((s) => `${s.key}:${s.value}`).join('|');
  const [hovered, setHovered] = useState<string | null>(null);

  const withAngles = slices.reduce<Array<DonutSlice & { fraction: number; startAngle: number }>>((acc, s) => {
    const cumulative = acc.reduce((sum, prev) => sum + prev.fraction, 0);
    const fraction = s.value / total;
    acc.push({ ...s, fraction, startAngle: cumulative * 360 - 90 });
    return acc;
  }, []);

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline();
    withAngles.forEach((s, i) => {
      const el = circleRefs.current[s.key];
      if (!el) return;
      const targetLen = s.fraction * CIRCUMFERENCE;
      if (reduced) {
        el.setAttribute('stroke-dasharray', `${targetLen} ${CIRCUMFERENCE}`);
        return;
      }
      const proxy = { len: 0 };
      el.setAttribute('stroke-dasharray', `0 ${CIRCUMFERENCE}`);
      tl.to(
        proxy,
        {
          len: targetLen,
          duration: 0.9,
          ease: 'power2.out',
          onUpdate: () => el.setAttribute('stroke-dasharray', `${proxy.len} ${CIRCUMFERENCE}`),
        },
        i * 0.25,
      );
    });
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  const hoveredSlice = withAngles.find((s) => s.key === hovered);
  const tooltipRows: TooltipRow[] = hoveredSlice
    ? [
        {
          label: hoveredSlice.label,
          value: `${hoveredSlice.value.toLocaleString('es')} (${Math.round(hoveredSlice.fraction * 100)}%)`,
          color: hoveredSlice.color,
        },
      ]
    : [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
      <div style={{ position: 'relative', width: SIZE, maxWidth: '100%' }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ width: '100%', height: 'auto', display: 'block' }} role="img" aria-label={ariaLabel}>
          <circle cx={CENTER} cy={CENTER} r={R} fill="none" stroke={colors.bgInputAlt} strokeWidth={STROKE} />
          {withAngles.map((s) => (
            <circle
              key={s.key}
              ref={(el) => { circleRefs.current[s.key] = el; }}
              cx={CENTER}
              cy={CENTER}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={hovered === s.key ? STROKE + 4 : STROKE}
              strokeLinecap="butt"
              style={{
                transform: `rotate(${s.startAngle}deg)`,
                transformOrigin: `${CENTER}px ${CENTER}px`,
                transition: 'stroke-width .15s ease',
                cursor: 'pointer',
              }}
              onPointerEnter={() => setHovered(s.key)}
              onPointerLeave={() => setHovered((h) => (h === s.key ? null : h))}
            />
          ))}
        </svg>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            pointerEvents: 'none',
          }}
        >
          <span style={{ fontSize: 22, fontWeight: 800, color: colors.textPrimary, fontFamily: fonts.body }}>
            {total.toLocaleString('es')}
          </span>
          <span style={{ fontSize: 10.5, color: colors.textMuted, fontWeight: 600 }}>{centerLabel}</span>
        </div>
        {hoveredSlice && <ChartTooltip x={50} y={100} title="" rows={tooltipRows} align="below" />}
      </div>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
        {withAngles.map((s) => (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: colors.textPrimary, fontWeight: 700 }}>
              {Math.round(s.fraction * 100)}%
            </span>
            <span style={{ fontSize: 11.5, color: colors.textMuted }}>{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
