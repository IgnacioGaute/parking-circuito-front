import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoginBrand } from '@/components/login/LoginBrand';
import { InstallAppButton } from '@/components/download/InstallAppButton';
import { colors, gridBackground } from '@/styles/theme';

export default function DescargarPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: colors.bg,
        ...gridBackground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: -180,
          left: -140,
          width: 460,
          height: 460,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(246,167,35,0.14),transparent 70%)',
          pointerEvents: 'none',
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: -160,
          right: -120,
          width: 380,
          height: 380,
          borderRadius: '50%',
          background: 'radial-gradient(circle,rgba(53,198,217,0.08),transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <ThemeToggle style={{ position: 'absolute', top: 20, right: 20, zIndex: 2 }} />

      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: colors.bgHeader,
          border: `1px solid ${colors.border}`,
          borderRadius: 22,
          boxShadow: `0 20px 60px ${colors.shadow}`,
          position: 'relative',
          zIndex: 1,
          animation: 'fadeUpLg .45s both',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 7,
            background: `repeating-linear-gradient(-45deg,${colors.accent} 0 14px,${colors.bgHeader} 14px 28px)`,
          }}
        />

        <div
          style={{
            padding: '34px 32px 30px',
            display: 'flex',
            flexDirection: 'column',
            gap: 26,
          }}
        >
          <LoginBrand />

          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: colors.textDim,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
              }}
            >
              Instalá la app en tu celular
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: colors.textMuted, lineHeight: 1.5 }}>
              Tocá el botón y confirmá la instalación. Va a quedar un ícono en la
              pantalla de inicio, igual que cualquier otra app.
            </p>
          </div>

          <InstallAppButton />

          <Link
            href="/login"
            style={{
              textAlign: 'center',
              fontSize: 12.5,
              color: colors.textDim,
              textDecoration: 'underline',
              textUnderlineOffset: 2,
            }}
          >
            ¿Ya la instalaste? Ingresar →
          </Link>
        </div>
      </div>
    </div>
  );
}
