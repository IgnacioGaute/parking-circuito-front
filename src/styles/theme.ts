// Every value here resolves to a CSS custom property, defined for both
// themes in globals.css ([data-theme="dark"] / [data-theme="light"]).
// Components read these once and the browser repaints them automatically
// when ThemeToggle flips the `data-theme` attribute — no React re-render,
// no prop drilling.
export const colors = {
  bg: 'var(--c-bg)',
  bgHeader: 'var(--c-bg-header)',
  bgCard: 'var(--c-bg-card)',
  bgInput: 'var(--c-bg-input)',
  bgInputAlt: 'var(--c-bg-input-alt)',
  border: 'var(--c-border)',
  borderDashed: 'var(--c-border-dashed)',
  textPrimary: 'var(--c-text-primary)',
  textMuted: 'var(--c-text-muted)',
  textDim: 'var(--c-text-dim)',
  textDimmer: 'var(--c-text-dimmer)',
  accent: 'var(--c-accent)',
  accentText: 'var(--c-accent-text)',
  accentContrast: 'var(--c-accent-contrast)',
  accentBgSoft: 'var(--c-accent-bg-soft)',
  accentBgSofter: 'var(--c-accent-bg-softer)',
  accentBgBadge: 'var(--c-accent-bg-badge)',
  accentDisabledBg: 'var(--c-accent-disabled-bg)',
  green: 'var(--c-green)',
  greenBgSoft: 'var(--c-green-bg-soft)',
  error: 'var(--c-error)',
  errorBgSoft: 'var(--c-error-bg-soft)',
  shadow: 'var(--c-shadow)',
  errorRingStart: 'var(--c-error-ring-start)',
  errorRingEnd: 'var(--c-error-ring-end)',
} as const;

export const fonts = {
  // Numeric/data readouts — clock, plates, initials, PIN pad, durations.
  mono: 'var(--font-ibm-plex-mono), monospace',
  // Everything else, including headings (no separate uppercase display
  // face in this design — hierarchy comes from weight/size/color).
  body: 'var(--font-manrope), system-ui, sans-serif',
} as const;

// The halo's size is in viewport units, not %, on purpose: a %-sized radial
// gradient is relative to the element's own box, and this background sits on
// wrapper divs that grow taller than the viewport on long scrollable pages —
// with % sizing the glow stretched down the whole page instead of staying a
// contained highlight near the top like the source design.
export const screenBackground = {
  backgroundImage:
    'radial-gradient(60vw 40vh at 100% 0%, var(--c-halo) 0%, transparent 80%), radial-gradient(var(--c-grid-dot) 1px, transparent 0)',
  backgroundSize: 'auto, 14px 14px',
  backgroundPosition: '0 0, 0 0',
} as const;
