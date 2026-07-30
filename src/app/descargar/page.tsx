import Link from 'next/link';
import { ThemeToggle } from '@/components/ThemeToggle';
import { LoginBrand } from '@/components/login/LoginBrand';
import { InstallAppButton } from '@/components/download/InstallAppButton';
import { colors, screenBackground } from '@/styles/theme';

export default function DescargarPage() {
  return (
    <div
      style={{
        minHeight: '100vh',
        position: 'relative',
        background: colors.bg,
        ...screenBackground,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        overflow: 'hidden',
      }}
    >
      <ThemeToggle style={{ position: 'absolute', top: 20, right: 20, zIndex: 2 }} />

      <div
        style={{
          width: '100%',
          maxWidth: 400,
          background: colors.bgCard,
          border: `1px solid ${colors.border}`,
          borderRadius: 16,
          boxShadow: `0 20px 60px ${colors.shadow}`,
          position: 'relative',
          zIndex: 1,
          animation: 'fadeUpLg .45s both',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: 4,
            background: colors.accent,
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
            <div style={{ fontSize: 15, fontWeight: 700 }}>Instalá la app en tu celular</div>
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
