import { colors, fonts } from '@/styles/theme';

export function LoginBrand() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 14,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          background: colors.accent,
          clipPath: 'polygon(0 0,100% 0,100% 70%,70% 100%,0 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 34,
            height: 6,
            background: colors.accentContrast,
            transform: 'rotate(-24deg)',
            borderRadius: 2,
          }}
        />
      </div>
      <div>
        <div
          style={{
            fontFamily: fonts.display,
            fontWeight: 800,
            fontSize: 24,
            textTransform: 'uppercase',
            letterSpacing: '0.03em',
            lineHeight: 1.1,
          }}
        >
          Control de
          <br />
          Estacionamiento
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
            marginTop: 10,
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: colors.green,
              animation: 'pulseDot 2s ease-in-out infinite',
            }}
          />
          <span
            style={{
              fontSize: 11,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Acceso de operador
          </span>
        </div>
      </div>
    </div>
  );
}
