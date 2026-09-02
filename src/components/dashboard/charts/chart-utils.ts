// Shared helpers for the Estadísticas charts — number formatting and the
// gold sequential ramp used by magnitude (single-hue) charts. Series
// identity colors (entradas/salidas, auto/moto) live directly on the chart
// components since there are only ever one or two of them; this file only
// holds what's genuinely shared across charts.
export function formatCompact(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 10_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString('es');
}

export function formatMinutes(mins: number): string {
  if (mins <= 0) return '0m';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

// Sequential "one hue, more-is-darker" ramp for magnitude bars (top
// patentes, actividad por operador): rank 0 gets full opacity, each
// subsequent rank steps down, with a floor so the tail stays visible.
export function sequentialOpacity(rank: number, total: number): number {
  if (total <= 1) return 1;
  const floor = 0.32;
  const step = (1 - floor) / (total - 1);
  return Math.max(floor, 1 - rank * step);
}

export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}
