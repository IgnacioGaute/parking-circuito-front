import { colors } from '@/styles/theme';

export function LoginBrand() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 16,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: 16,
          background: colors.accent,
          boxShadow: `0 0 0 8px ${colors.accentBgSofter}, 0 14px 34px ${colors.accentBgSoft}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 32,
            height: 6,
            background: colors.accentContrast,
            transform: 'rotate(-24deg)',
            borderRadius: 3,
          }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            fontWeight: 800,
            fontSize: 21,
            lineHeight: 1.2,
            letterSpacing: '-0.02em',
          }}
        >
          Control de Estacionamiento
        </div>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: colors.greenBgSoft,
            borderRadius: 999,
            padding: '6px 12px',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: colors.green,
              animation: 'pulseDot 2s ease-in-out infinite',
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11.5, fontWeight: 600, color: colors.green }}>
            Sistema activo
          </span>
        </div>
      </div>
    </div>
  );
}
