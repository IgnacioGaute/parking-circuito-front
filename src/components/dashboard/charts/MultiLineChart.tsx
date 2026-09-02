'use client';

import gsap from 'gsap';
import { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { colors, fonts } from '@/styles/theme';
import { ChartTooltip, type TooltipRow } from './ChartTooltip';
import { prefersReducedMotion } from './chart-utils';

export interface LineSeries {
  key: string;
  label: string;
  color: string;
  values: number[];
}

interface MultiLineChartProps {
  categories: string[];
  series: LineSeries[];
  height?: number;
  valueFormat?: (n: number) => string;
  // Show every Nth x-axis label (the rest still get a tick + hover target).
  labelEvery?: number;
  ariaLabel: string;
}

const DEFAULT_VW = 640;
const PAD = { top: 14, right: 14, bottom: 26, left: 34 };

function niceCeil(value: number): number {
  if (value <= 0) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const residual = value / magnitude;
  const step = residual <= 1 ? 1 : residual <= 2 ? 2 : residual <= 5 ? 5 : 10;
  return step * magnitude;
}

// One line chart for both jobs this dashboard needs: a single-series area
// (daily trend, sequential gold) and a two-series comparison (entradas vs
// salidas by hour, categorical). Draws itself in with the stroke-dasharray
// technique (hyperframes-animation/rules/svg-path-draw.md) rather than a
// generic fade, and re-draws the same way whenever the filtered data
// changes so a new filter reads as a redraw, not a jump-cut.
export function MultiLineChart({
  categories,
  series,
  height = 240,
  valueFormat = (n) => n.toLocaleString('es'),
  labelEvery = 1,
  ariaLabel,
}: MultiLineChartProps) {
  // The viewBox width tracks the actual rendered pixel width (measured via
  // ResizeObserver) instead of a fixed abstract unit count — with a fixed
  // viewBox, 1 SVG unit stops equalling 1 CSS px on any container narrower
  // than the design width, and every <text> element shrinks along with it
  // (illegible axis labels on a ~320px mobile card). Matching the two keeps
  // font sizes literal regardless of how narrow the card is.
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [vw, setVw] = useState(DEFAULT_VW);
  useLayoutEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width;
      if (width && width > 0) setVw(Math.round(width));
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const plotWidth = vw - PAD.left - PAD.right;
  const plotHeight = height - PAD.top - PAD.bottom;

  const maxValue = useMemo(() => {
    const max = Math.max(1, ...series.flatMap((s) => s.values));
    return niceCeil(max * 1.15);
  }, [series]);

  const xAt = (i: number) => PAD.left + (categories.length <= 1 ? 0 : (i / (categories.length - 1)) * plotWidth);
  const yAt = (v: number) => PAD.top + plotHeight - (v / maxValue) * plotHeight;

  const paths = useMemo(
    () =>
      series.map((s) => ({
        key: s.key,
        d: s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${xAt(i)} ${yAt(v)}`).join(' '),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, categories.length, maxValue, vw],
  );

  const pathRefs = useRef<Record<string, SVGPathElement | null>>({});
  const dotRefs = useRef<Record<string, SVGCircleElement | null>>({});
  const areaRefs = useRef<Record<string, SVGPathElement | null>>({});
  const dataSignature = `${vw}|${categories.join(',')}|${series.map((s) => `${s.key}:${s.values.join(',')}`).join('|')}`;

  useLayoutEffect(() => {
    const reduced = prefersReducedMotion();
    const tl = gsap.timeline();
    series.forEach((s, i) => {
      const path = pathRefs.current[s.key];
      const dot = dotRefs.current[s.key];
      const area = areaRefs.current[s.key];
      if (!path) return;
      const len = path.getTotalLength();
      if (reduced) {
        path.style.strokeDasharray = '';
        path.style.strokeDashoffset = '0';
        if (area) gsap.set(area, { opacity: 0.1 });
        if (dot) gsap.set(dot, { scale: 1, transformOrigin: 'center' });
        return;
      }
      path.style.strokeDasharray = `${len}`;
      path.style.strokeDashoffset = `${len}`;
      if (dot) gsap.set(dot, { scale: 0, transformOrigin: 'center' });
      if (area) gsap.set(area, { opacity: 0 });
      const start = i * 0.15;
      tl.to(path, { strokeDashoffset: 0, duration: 0.85, ease: 'power2.out' }, start);
      if (area) tl.to(area, { opacity: 0.1, duration: 0.5, ease: 'power1.out' }, start + 0.6);
      if (dot) tl.to(dot, { scale: 1, duration: 0.4, ease: 'back.out(1.6)' }, start + 0.75);
    });
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataSignature]);

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const handleMove = (event: React.PointerEvent<SVGRectElement>) => {
    const svg = svgRef.current;
    if (!svg || categories.length === 0) return;
    const rect = svg.getBoundingClientRect();
    const relX = ((event.clientX - rect.left) / rect.width) * vw;
    const clamped = Math.min(Math.max(relX, PAD.left), PAD.left + plotWidth);
    const idx = Math.round(((clamped - PAD.left) / plotWidth) * (categories.length - 1));
    setHoverIndex(Math.min(Math.max(idx, 0), categories.length - 1));
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(maxValue * f));

  const tooltipRows: TooltipRow[] =
    hoverIndex === null
      ? []
      : series.map((s) => ({ label: s.label, value: valueFormat(s.values[hoverIndex] ?? 0), color: s.color }));

  return (
    <div ref={wrapperRef} style={{ position: 'relative' }}>
      {series.length > 1 && (
        <div style={{ display: 'flex', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
          {series.map((s) => (
            <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: s.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11.5, color: colors.textMuted, fontWeight: 600 }}>{s.label}</span>
            </div>
          ))}
        </div>
      )}
      <svg
        ref={svgRef}
        viewBox={`0 0 ${vw} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', overflow: 'visible' }}
        role="img"
        aria-label={ariaLabel}
      >
        {yTicks.map((tick, i) => {
          const y = yAt(tick);
          return (
            <g key={tick + i}>
              <line
                x1={PAD.left}
                x2={vw - PAD.right}
                y1={y}
                y2={y}
                stroke={colors.border}
                strokeWidth={1}
                shapeRendering="crispEdges"
              />
              <text x={PAD.left - 8} y={y + 3} textAnchor="end" fontSize={9.5} fill={colors.textDim} fontFamily={fonts.mono}>
                {formatTick(tick)}
              </text>
            </g>
          );
        })}

        {categories.map((cat, i) =>
          i % labelEvery === 0 ? (
            <text
              key={cat + i}
              x={xAt(i)}
              y={height - 6}
              textAnchor="middle"
              fontSize={9.5}
              fill={colors.textDim}
              fontFamily={fonts.mono}
            >
              {cat}
            </text>
          ) : null,
        )}

        {hoverIndex !== null && (
          <line
            x1={xAt(hoverIndex)}
            x2={xAt(hoverIndex)}
            y1={PAD.top}
            y2={PAD.top + plotHeight}
            stroke={colors.textDim}
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}

        {series.map((s) => {
          const areaD = `${paths.find((p) => p.key === s.key)?.d ?? ''} L ${xAt(categories.length - 1)} ${PAD.top + plotHeight} L ${xAt(0)} ${PAD.top + plotHeight} Z`;
          const lastIdx = categories.length - 1;
          const lastValue = s.values[lastIdx] ?? 0;
          return (
            <g key={s.key}>
              {series.length === 1 && (
                <path ref={(el) => { areaRefs.current[s.key] = el; }} d={areaD} fill={s.color} stroke="none" />
              )}
              <path
                ref={(el) => { pathRefs.current[s.key] = el; }}
                d={paths.find((p) => p.key === s.key)?.d}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Permanent end-marker (mark spec: "Lines -> value at the end") — also the
                  only visible mark for a single-category range, where the line itself
                  has zero length. */}
              <circle cx={xAt(lastIdx)} cy={yAt(lastValue)} r={4} fill={s.color} stroke={colors.bgCard} strokeWidth={2} />
              {series.length === 1 && categories.length <= 3 && (
                <text
                  x={xAt(lastIdx)}
                  y={yAt(lastValue) - 12}
                  textAnchor="middle"
                  fontSize={12}
                  fontWeight={700}
                  fill={colors.textPrimary}
                  fontFamily={fonts.mono}
                >
                  {valueFormat(lastValue)}
                </text>
              )}
              {hoverIndex !== null && (
                <circle
                  ref={(el) => { dotRefs.current[s.key] = el; }}
                  cx={xAt(hoverIndex)}
                  cy={yAt(s.values[hoverIndex] ?? 0)}
                  r={4}
                  fill={s.color}
                  stroke={colors.bgCard}
                  strokeWidth={2}
                />
              )}
            </g>
          );
        })}

        <rect
          x={PAD.left}
          y={PAD.top}
          width={plotWidth}
          height={plotHeight}
          fill="transparent"
          onPointerMove={handleMove}
          onPointerLeave={() => setHoverIndex(null)}
          style={{ cursor: 'crosshair' }}
        />
      </svg>

      {hoverIndex !== null && (
        <ChartTooltip
          x={(xAt(hoverIndex) / vw) * 100}
          y={(yAt(Math.max(...series.map((s) => s.values[hoverIndex] ?? 0))) / height) * 100}
          title={categories[hoverIndex]}
          rows={tooltipRows}
          align="above"
        />
      )}
    </div>
  );
}

function formatTick(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k`;
  return String(n);
}
