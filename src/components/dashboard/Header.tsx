'use client';

import gsap from 'gsap';
import { CircleHelp, Clock, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { clearActiveOperator } from '@/lib/active-operator';
import { prefersReducedMotion } from '@/lib/motion';
import { colors, fonts } from '@/styles/theme';
import type { TabKey } from './NavTabs';

interface HeaderProps {
  operatorName: string;
  isDesktop?: boolean;
  onStartTour: () => void;
  activeTab: TabKey;
  insideCount: number;
}

// Mirrors the per-tab contextual title/subtitle from the mobile header in
// the Claude Design mockup — the mobile header shows what screen you're on
// instead of the static app name (which only appears on login).
const TAB_COPY: Record<TabKey, [string, string]> = {
  registrar: ['Registrar entrada', 'Cargá una placa o buscá un frecuente'],
  dentro: ['Dentro', ''],
  frecuentes: ['Frecuentes', 'Vehículos que vuelven seguido'],
  historial: ['Historial', 'Movimientos registrados'],
  usuarios: ['Usuarios', 'Operadores del sistema'],
  admin: ['Administración', 'Operadores y campos del formulario'],
};

export function Header({
  operatorName,
  isDesktop = false,
  onStartTour,
  activeTab,
  insideCount,
}: HeaderProps) {
  const router = useRouter();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Clock is client-only (no server-rendered value to hydrate against),
    // so the initial tick has to be set here rather than derived at render time.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleChange = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    clearActiveOperator();
    router.push('/login');
  };

  const helpButton = (
    <button
      onClick={onStartTour}
      title="Ver recorrido guiado"
      aria-label="Ver recorrido guiado"
      className="ui-btn ui-ghost"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 34,
        height: 34,
        border: `1px solid ${colors.border}`,
        background: 'transparent',
        color: colors.textMuted,
        borderRadius: 9,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <CircleHelp size={16} strokeWidth={2} />
    </button>
  );

  const clockAndTheme = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: colors.textMuted }}>
        <Clock size={14} strokeWidth={2} />
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 12.5,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {now
            ? now.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
            : '--:--:--'}
        </span>
      </div>
      {helpButton}
      <ThemeToggle />
    </div>
  );

  const operatorStatus = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: colors.green,
          flexShrink: 0,
          animation: 'pulseDot 2s ease-in-out infinite',
        }}
      />
      <span style={{ fontSize: 13, fontWeight: 600, color: colors.textPrimary, flexShrink: 0 }}>
        {operatorName}
      </span>
    </div>
  );

  const logoutButton = (
    <button
      onClick={handleChange}
      title="Cerrar turno"
      className="ui-btn ui-ghost"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        border: `1px solid ${colors.border}`,
        background: 'transparent',
        color: colors.textMuted,
        borderRadius: 8,
        cursor: 'pointer',
        flexShrink: 0,
      }}
    >
      <LogOut size={14} strokeWidth={2.2} />
    </button>
  );

  const mobileLogoutButton = (
    <button
      onClick={handleChange}
      className="ui-btn ui-ghost"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        border: `1px solid ${colors.border}`,
        background: 'transparent',
        color: colors.textMuted,
        borderRadius: 9,
        padding: '6px 11px',
        fontSize: 11.5,
        fontWeight: 700,
        cursor: 'pointer',
        flexShrink: 0,
        font: 'inherit',
      }}
    >
      <LogOut size={13} strokeWidth={2.2} />
      Cerrar turno
    </button>
  );

  const [screenTitle, screenSubBase] = TAB_COPY[activeTab];
  const screenSub =
    activeTab === 'dentro'
      ? `${insideCount} ${insideCount === 1 ? 'vehículo' : 'vehículos'} en el predio`
      : screenSubBase;

  // Small "screen changed" cue on the mobile title block — skips its own
  // first run since the header's outer fadeUp already covers first paint;
  // this only plays when activeTab actually changes afterwards.
  const titleRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  useLayoutEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (prefersReducedMotion()) return;
    const tween = gsap.fromTo(el, { opacity: 0, y: -6 }, { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' });
    return () => {
      tween.kill();
    };
  }, [activeTab]);

  // Desktop: the brand mark lives in the sidebar now, so this is a slim
  // single-row utility bar instead of the mobile two-row layout.
  if (isDesktop) {
    return (
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          background: colors.bgHeader,
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderBottom: `1px solid ${colors.border}`,
          padding: '14px 28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 14,
          animation: 'fadeUp .45s both',
        }}
      >
        {operatorStatus}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {clockAndTheme}
          {logoutButton}
        </div>
      </header>
    );
  }

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: colors.bgHeader,
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${colors.border}`,
        padding: '16px 20px 13px',
        display: 'flex',
        flexDirection: 'column',
        gap: 11,
        animation: 'fadeUp .45s both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0 }}>
          <div
            style={{
              width: 26,
              height: 26,
              flexShrink: 0,
              borderRadius: 7,
              background: colors.accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 15,
                height: 3.5,
                background: colors.accentContrast,
                transform: 'rotate(-24deg)',
                borderRadius: 2,
              }}
            />
          </div>
          <div ref={titleRef} style={{ minWidth: 0 }}>
            <div
              style={{
                fontWeight: 800,
                fontSize: 17,
                lineHeight: 1.15,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {screenTitle}
            </div>
            {screenSub && (
              <div
                style={{
                  fontSize: 11.5,
                  color: colors.textMuted,
                  lineHeight: 1.3,
                  marginTop: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {screenSub}
              </div>
            )}
          </div>
        </div>

        {clockAndTheme}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          {operatorStatus}
          <span style={{ fontSize: 11.5, color: colors.textDim, flexShrink: 0 }}>· en turno</span>
        </div>
        {mobileLogoutButton}
      </div>
    </header>
  );
}
