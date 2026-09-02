import { colors, fonts } from '@/styles/theme';

export interface TooltipRow {
  label: string;
  value: string;
  color: string;
}

interface ChartTooltipProps {
  x: number;
  y: number;
  title: string;
  rows: TooltipRow[];
  // Flips the tooltip above the point instead of below when there isn't
  // room underneath (near the top of a card).
  align?: 'below' | 'above';
}

// Shared floating tooltip for every chart — line key (a short stroke of the
// series color), value leads in bold, label follows secondary. Positioned
// by the caller (pointer-relative x/y within the chart's SVG viewBox
// coordinate space, then scaled to the rendered box via CSS percentages so
// it stays correct across the chart's own responsive scaling).
export function ChartTooltip({ x, y, title, rows, align = 'below' }: ChartTooltipProps) {
  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        left: `${x}%`,
        top: `${y}%`,
        transform: `translate(-50%, ${align === 'below' ? '10px' : 'calc(-100% - 10px)'})`,
        pointerEvents: 'none',
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: 10,
        padding: '8px 11px',
        boxShadow: `0 8px 24px ${colors.shadow}`,
        zIndex: 5,
        minWidth: 120,
        whiteSpace: 'nowrap',
      }}
    >
      <div style={{ fontSize: 10.5, fontWeight: 700, color: colors.textMuted, marginBottom: 5 }}>
        {title}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {rows.map((row) => (
          <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
            <span
              style={{
                width: 10,
                height: 2,
                borderRadius: 1,
                background: row.color,
                flexShrink: 0,
              }}
            />
            <span style={{ fontFamily: fonts.mono, fontWeight: 700, fontSize: 12.5, color: colors.textPrimary }}>
              {row.value}
            </span>
            <span style={{ fontSize: 11, color: colors.textMuted }}>{row.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
