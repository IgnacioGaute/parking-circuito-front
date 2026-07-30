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
  // Same hue as `accent`, but darkened for the light theme so it stays
  // legible as *text on a page background* (accent itself is tuned to sit
  // on filled buttons/badges, where a bright, light-theme-friendly orange
  // still contrasts fine against dark button text in both themes).
  accentText: 'var(--c-accent-text)',
  accentContrast: 'var(--c-accent-contrast)',
  accentBgSoft: 'var(--c-accent-bg-soft)',
  accentBgSofter: 'var(--c-accent-bg-softer)',
  accentBgBadge: 'var(--c-accent-bg-badge)',
  accentDisabledBg: 'var(--c-accent-disabled-bg)',
  green: 'var(--c-green)',
  greenBgSoft: 'var(--c-green-bg-soft)',
  cyanAuto: 'var(--c-cyan-auto)',
  cyanAutoBgSoft: 'var(--c-cyan-auto-bg-soft)',
  cyanAutoBgSofter: 'var(--c-cyan-auto-bg-softer)',
  pinkMoto: 'var(--c-pink-moto)',
  pinkMotoBgSoft: 'var(--c-pink-moto-bg-soft)',
  pinkMotoBgSofter: 'var(--c-pink-moto-bg-softer)',
  teal: 'var(--c-teal)',
  tealText: 'var(--c-teal-text)',
  badgeInsideBg: 'var(--c-badge-inside-bg)',
  error: 'var(--c-error)',
  plateBg: 'var(--c-plate-bg)',
  plateText: 'var(--c-plate-text)',
  shadow: 'var(--c-shadow)',
} as const;

export const fonts = {
  display: 'var(--font-barlow-condensed), sans-serif',
  body: 'var(--font-space-grotesk), system-ui, sans-serif',
} as const;

export const gridBackground = {
  backgroundImage:
    'linear-gradient(var(--c-grid-line) 1px,transparent 1px),linear-gradient(90deg,var(--c-grid-line) 1px,transparent 1px)',
  backgroundSize: '34px 34px',
} as const;
