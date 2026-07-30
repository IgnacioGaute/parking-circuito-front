'use client';

import { Check, Download, MoreVertical } from 'lucide-react';
import { useEffect, useState } from 'react';
import { colors, fonts } from '@/styles/theme';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const buttonStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  border: 'none',
  cursor: 'pointer',
  padding: '18px 20px',
  borderRadius: 16,
  font: 'inherit',
  fontFamily: fonts.display,
  fontWeight: 800,
  fontSize: 18,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  background: colors.accent,
  color: colors.accentContrast,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
};

const hintBoxStyle: React.CSSProperties = {
  fontSize: 12.5,
  color: colors.textPrimary,
  background: colors.bgInputAlt,
  border: `1px solid ${colors.border}`,
  borderRadius: 12,
  padding: '12px 16px',
  textAlign: 'center',
};

const stepStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 10,
  fontSize: 13.5,
  color: colors.textPrimary,
  textAlign: 'left',
};

const stepNumberStyle: React.CSSProperties = {
  flexShrink: 0,
  width: 20,
  height: 20,
  borderRadius: 7,
  background: colors.accentBgSofter,
  color: colors.accentText,
  fontFamily: fonts.display,
  fontWeight: 800,
  fontSize: 11.5,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

export function InstallAppButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(
    null,
  );
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [attempted, setAttempted] = useState(false);

  useEffect(() => {
    // matchMedia/userAgent only exist client-side, so this can't be derived
    // during render — there's no SSR-safe equivalent to read up front.
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsStandalone(standalone);
    setIsIOS(/iPad|iPhone|iPod/.test(window.navigator.userAgent));

    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      return;
    }
    setAttempted(true);
  };

  if (isStandalone) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          fontSize: 13.5,
          color: colors.green,
          fontWeight: 600,
        }}
      >
        <Check size={16} strokeWidth={2.4} />
        Ya tenés la app instalada en este dispositivo.
      </div>
    );
  }

  if (isIOS) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          background: colors.bgInputAlt,
          border: `1px solid ${colors.border}`,
          borderRadius: 14,
          padding: '16px 18px',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: colors.accentText,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
          }}
        >
          Para instalarla en tu iPhone
        </div>
        <div style={stepStyle}>
          <span style={stepNumberStyle}>1</span>
          <span>
            Tocá el ícono de <strong style={{ color: colors.textPrimary }}>Compartir</strong>{' '}
            (el cuadrado con la flecha hacia arriba) en la barra de Safari.
          </span>
        </div>
        <div style={stepStyle}>
          <span style={stepNumberStyle}>2</span>
          <span>
            Elegí{' '}
            <strong style={{ color: colors.textPrimary }}>&quot;Agregar a inicio&quot;</strong>{' '}
            en la lista de opciones.
          </span>
        </div>
        <div style={stepStyle}>
          <span style={stepNumberStyle}>3</span>
          <span>
            Tocá <strong style={{ color: colors.textPrimary }}>&quot;Agregar&quot;</strong>{' '}
            arriba a la derecha.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button onClick={handleClick} style={buttonStyle}>
        <Download size={19} strokeWidth={2.2} />
        Descargar app
      </button>
      {attempted && !deferredPrompt && (
        <div style={hintBoxStyle}>
          Tu navegador todavía no ofreció instalación automática. Abrí el menú{' '}
          <MoreVertical
            size={13}
            strokeWidth={2.4}
            style={{ verticalAlign: 'middle', display: 'inline' }}
          />{' '}
          (arriba a la derecha) y buscá{' '}
          <strong style={{ color: colors.textPrimary }}>&quot;Instalar app&quot;</strong> o{' '}
          <strong style={{ color: colors.textPrimary }}>
            &quot;Agregar a pantalla de inicio&quot;
          </strong>
          .
        </div>
      )}
    </div>
  );
}
