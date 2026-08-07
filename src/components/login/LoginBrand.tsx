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
          width: 52,
          height: 52,
          borderRadius: 14,
          background: colors.accent,
          boxShadow: `0 0 0 7px ${colors.accentBgSofter}, 0 10px 28px ${colors.accentBgSoft}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 30,
            height: 5.5,
            background: colors.accentContrast,
            transform: 'rotate(-24deg)',
            borderRadius: 3,
          }}
        />
      </div>
      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 20,
            lineHeight: 1.2,
            letterSpacing: '-0.01em',
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
            padding: '4px 10px',
            marginTop: 10,
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
