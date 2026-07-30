import { colors } from '@/styles/theme';

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
          width: 44,
          height: 44,
          borderRadius: 11,
          background: colors.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            width: 26,
            height: 5,
            background: colors.accentContrast,
            transform: 'rotate(-24deg)',
            borderRadius: 2,
          }}
        />
      </div>
      <div>
        <div
          style={{
            fontWeight: 700,
            fontSize: 20,
            lineHeight: 1.2,
          }}
        >
          Control de Estacionamiento
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
          <span style={{ fontSize: 12, color: colors.textMuted }}>Acceso de operador</span>
        </div>
      </div>
    </div>
  );
}
