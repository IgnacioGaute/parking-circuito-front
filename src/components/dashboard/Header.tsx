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
  estadisticas: ['Estadísticas', 'Actividad, ocupación y tendencias'],
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
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          color: colors.textMuted,
          background: colors.bgInputAlt,
          border: `1px solid ${colors.border}`,
          borderRadius: 999,
          padding: '6px 11px 6px 9px',
        }}
      >
        <Clock size={13} strokeWidth={2} />
        <span
          style={{
            fontFamily: fonts.mono,
            fontSize: 12,
            fontWeight: 600,
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
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 7,
        minWidth: 0,
        background: colors.greenBgSoft,
        border: `1px solid ${colors.border}`,
        borderRadius: 999,
        padding: '5px 11px 5px 9px',
      }}
    >
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
      <span
        style={{
          fontSize: 12.5,
          fontWeight: 700,
          color: colors.textPrimary,
          flexShrink: 1,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
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
        borderRadius: 999,
        padding: '6px 12px',
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

  // First-paint choreography, mobile only: the header itself already fades
  // up (CSS), but the brand mark gets its own little entrance on top of
  // that — a spring pop instead of just riding the flat fade — and the
  // status/clock row settles in a beat after it. Runs once on mount.
  const iconRef = useRef<HTMLDivElement>(null);
  const statusRowRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    if (isDesktop || prefersReducedMotion()) return;
    const icon = iconRef.current;
    const statusRow = statusRowRef.current;
    if (!icon) return;
    gsap.set(icon, { scale: 0.4, rotate: -18, opacity: 0 });
    if (statusRow) gsap.set(statusRow, { opacity: 0, y: 6 });
    const tl = gsap.timeline({ delay: 0.15 });
    tl.to(icon, { scale: 1, rotate: 0, opacity: 1, duration: 0.55, ease: 'back.out(1.5)' }, 0);
    if (statusRow) tl.to(statusRow, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.3);
    return () => {
      tl.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        padding: '16px 20px 13px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        animation: 'fadeUp .45s both',
        overflow: 'hidden',
      }}
    >
      <div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(140px 90px at 14% -10%, var(--c-halo), transparent)',
          pointerEvents: 'none',
        }}
      />
      <div
        aria-hidden
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          background: `linear-gradient(90deg, ${colors.accent}, transparent 65%)`,
          opacity: 0.5,
        }}
      />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, position: 'relative' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
          <div
            ref={iconRef}
            style={{
              width: 30,
              height: 30,
              flexShrink: 0,
              borderRadius: 9,
              background: colors.accent,
              boxShadow: '0 4px 14px -3px rgba(217,164,65,0.5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 16,
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
                fontSize: 17.5,
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

      <div
        ref={statusRowRef}
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, position: 'relative' }}
      >
        {operatorStatus}
        {mobileLogoutButton}
      </div>
    </header>
  );
}
