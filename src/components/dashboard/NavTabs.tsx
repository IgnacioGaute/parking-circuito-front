'use client';

import gsap from 'gsap';
import {
  BarChart3,
  Car,
  List,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Star,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { prefersReducedMotion } from '@/lib/motion';
import { colors, fonts } from '@/styles/theme';

export type TabKey =
  | 'registrar'
  | 'dentro'
  | 'frecuentes'
  | 'historial'
  | 'estadisticas'
  | 'usuarios'
  | 'admin';

interface TabDef {
  key: TabKey;
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  badge: number | null;
}

interface NavTabsProps {
  isDesktop: boolean;
  activeTab: TabKey;
  insideCount: number;
  isAdmin: boolean;
  onSelect: (tab: TabKey) => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

export function NavTabs({
  isDesktop,
  activeTab,
  insideCount,
  isAdmin,
  onSelect,
  collapsed,
  onToggleCollapsed,
}: NavTabsProps) {
  // A sliding highlight pill reads as one tab handing off to the next,
  // instead of one button's color cutting out while another's cuts in — so
  // it's measured/animated here rather than left as each button's own
  // inline active background. Hooks run unconditionally (desktop-only
  // logic lives inside the effect) since MobileNavTabs renders below.
  const listRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const list = listRef.current;
    const pill = pillRef.current;
    if (!isDesktop || !list || !pill) return;
    const activeEl = list.querySelector<HTMLElement>(`[data-tab-key="${activeTab}"]`);
    if (!activeEl) {
      gsap.set(pill, { opacity: 0 });
      return;
    }
    const listRect = list.getBoundingClientRect();
    const activeRect = activeEl.getBoundingClientRect();
    const target = { opacity: 1, y: activeRect.top - listRect.top, height: activeRect.height };
    if (prefersReducedMotion()) {
      gsap.set(pill, target);
    } else {
      gsap.to(pill, { ...target, duration: 0.35, ease: 'power3.out' });
    }
  }, [activeTab, collapsed, isDesktop, isAdmin]);

  if (!isDesktop) {
    return (
      <MobileNavTabs
        activeTab={activeTab}
        insideCount={insideCount}
        isAdmin={isAdmin}
        onSelect={onSelect}
      />
    );
  }

  const tabs: TabDef[] = [
    { key: 'registrar', label: 'Registrar', Icon: Plus, badge: null },
    { key: 'dentro', label: 'Dentro', Icon: Car, badge: insideCount || null },
    { key: 'frecuentes', label: 'Frecuentes', Icon: Star, badge: null },
    { key: 'historial', label: 'Historial', Icon: List, badge: null },
    { key: 'estadisticas', label: 'Estadísticas', Icon: BarChart3, badge: null },
    { key: 'usuarios', label: 'Usuarios', Icon: Users, badge: null },
    ...(isAdmin
      ? [{ key: 'admin' as const, label: 'Admin', Icon: Settings, badge: null }]
      : []),
  ];

  const rail = collapsed;

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: isDesktop ? 'column' : 'row',
        background: isDesktop ? colors.bgCard : colors.bgHeader,
        borderBottom: isDesktop ? 'none' : `1px solid ${colors.border}`,
        borderRight: isDesktop ? `1px solid ${colors.border}` : 'none',
        borderTop: isDesktop ? 'none' : `1px solid ${colors.border}`,
        width: isDesktop ? (rail ? 76 : 248) : '100%',
        flexShrink: 0,
        padding: isDesktop ? '16px 12px' : '4px 4px',
        paddingBottom: isDesktop ? 16 : 'calc(4px + env(safe-area-inset-bottom))',
        gap: isDesktop ? 4 : 2,
        position: isDesktop ? 'sticky' : 'fixed',
        // On mobile this must stay 'auto': `fixed` with both top and bottom
        // set stretches the element to fill the full viewport height
        // instead of sizing to its content as a bottom bar.
        top: isDesktop ? 0 : 'auto',
        bottom: isDesktop ? 'auto' : 0,
        left: 0,
        right: 0,
        height: isDesktop ? '100vh' : 'auto',
        zIndex: 15,
        alignSelf: isDesktop ? undefined : 'flex-start',
        transition: isDesktop ? 'width .2s ease' : 'none',
        overflow: 'hidden',
      }}
    >
      {isDesktop && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 9,
            padding: rail ? '4px 0 18px' : '4px 6px 18px',
            justifyContent: rail ? 'center' : 'flex-start',
          }}
        >
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
          {!rail && (
            <div
              style={{
                fontWeight: 700,
                fontSize: 14.5,
                lineHeight: 1.2,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Control de Estacionamiento
            </div>
          )}
        </div>
      )}

      <div
        ref={listRef}
        style={{
          display: 'flex',
          flexDirection: isDesktop ? 'column' : 'row',
          // Must grow in both branches: on mobile this fills the nav row's
          // full width (so the flex:1 buttons inside have room to spread
          // out); on desktop it fills the remaining sidebar height between
          // the brand and the collapse button.
          flex: 1,
          minHeight: 0,
          gap: isDesktop ? 2 : 2,
          position: 'relative',
        }}
      >
        {isDesktop && (
          <div
            ref={pillRef}
            aria-hidden
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: 0,
              opacity: 0,
              borderRadius: 9,
              background: colors.accentBgSoft,
              boxShadow: `inset 3px 0 0 ${colors.accent}`,
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
        )}
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.key}
              data-tab-key={tab.key}
              onClick={() => onSelect(tab.key)}
              title={rail ? tab.label : undefined}
              className="ui-btn ui-navtab"
              style={{
                flex: isDesktop ? 'none' : 1,
                // Flex items default to `min-width: auto`, i.e. their
                // content's natural width — without this, longer labels
                // like "Historial"/"Usuarios" claim more of the row than
                // "Dentro" instead of every tab getting an equal share.
                minWidth: isDesktop ? undefined : 0,
                width: isDesktop ? '100%' : 'auto',
                display: 'flex',
                flexDirection: isDesktop ? 'row' : 'column',
                alignItems: 'center',
                justifyContent: isDesktop ? (rail ? 'center' : 'flex-start') : 'center',
                gap: isDesktop ? 10 : 3,
                border: 'none',
                borderRadius: isDesktop ? 9 : 0,
                borderTop: isDesktop
                  ? 'none'
                  : active
                    ? `2px solid ${colors.accent}`
                    : '2px solid transparent',
                cursor: 'pointer',
                padding: isDesktop ? (rail ? '10px 0' : '10px 12px') : '9px 4px 7px',
                // Desktop's highlight is the sliding pill behind the list
                // (see pillRef) — an active-only background here would
                // double up and flash ahead of the pill's own animation.
                background: !isDesktop && active ? colors.accentBgSofter : 'transparent',
                color: active ? colors.accent : colors.textMuted,
                transition: 'color .15s, background .15s, box-shadow .15s',
                font: 'inherit',
                position: 'relative',
                zIndex: 1,
              }}
            >
              <span style={{ display: 'flex', flexShrink: 0, position: 'relative' }}>
                <Icon size={isDesktop ? 18 : 19} strokeWidth={2} />
                {rail && tab.badge != null && (
                  <span
                    style={{
                      position: 'absolute',
                      top: -6,
                      right: -7,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: colors.accent,
                    }}
                  />
                )}
              </span>
              {!rail && (
                <span
                  style={{
                    fontSize: isDesktop ? 14 : 10.5,
                    fontWeight: 600,
                    flex: isDesktop ? 1 : 'none',
                    textAlign: 'left',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {tab.label}
                </span>
              )}
              {!rail && tab.badge != null && (
                <span
                  style={{
                    position: isDesktop ? 'static' : 'absolute',
                    top: isDesktop ? 'auto' : 2,
                    right: isDesktop ? 'auto' : 14,
                    background: active ? colors.accentBgBadge : colors.bgInputAlt,
                    color: active ? colors.accent : colors.textPrimary,
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '1px 7px',
                    borderRadius: 999,
                    minWidth: 17,
                    textAlign: 'center',
                    lineHeight: 1.4,
                    flexShrink: 0,
                  }}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {isDesktop && (
        <button
          onClick={onToggleCollapsed}
          title={collapsed ? 'Expandir menú' : 'Contraer menú'}
          className="ui-btn ui-ghost"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: rail ? 'center' : 'flex-start',
            gap: 10,
            border: `1px solid ${colors.border}`,
            borderRadius: 9,
            background: 'transparent',
            color: colors.textMuted,
            cursor: 'pointer',
            padding: rail ? '9px 0' : '9px 12px',
            marginTop: 8,
            flexShrink: 0,
            font: 'inherit',
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          {collapsed ? (
            <PanelLeftOpen size={17} strokeWidth={2} />
          ) : (
            <PanelLeftClose size={17} strokeWidth={2} />
          )}
          {!rail && <span>Contraer</span>}
        </button>
      )}
    </nav>
  );
}

// ---------------------------------------------------------------------------
// Mobile bottom bar — five pills (Registrar/Dentro/Frecuentes/Historial/Más),
// only the active one expands and shows its label; Usuarios and Admin live in
// the "Más" sheet instead of claiming a sixth column, which is what stopped
// labels from clipping at 402px-wide phones. Kept separate from the desktop
// sidebar render above since the two share no layout, only tokens.
// ---------------------------------------------------------------------------

interface MobileNavTabsProps {
  activeTab: TabKey;
  insideCount: number;
  isAdmin: boolean;
  onSelect: (tab: TabKey) => void;
}

interface MobilePillDef {
  key: TabKey | 'more';
  label: string;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
}

const MOBILE_PILLS: MobilePillDef[] = [
  { key: 'registrar', label: 'Registrar', Icon: Plus },
  { key: 'dentro', label: 'Dentro', Icon: Car },
  { key: 'frecuentes', label: 'Frecuentes', Icon: Star },
  { key: 'historial', label: 'Historial', Icon: List },
  { key: 'more', label: 'Más', Icon: MoreHorizontal },
];

function MobileNavTabs({ activeTab, insideCount, isAdmin, onSelect }: MobileNavTabsProps) {
  const [moreOpen, setMoreOpen] = useState(false);
  const inMore = activeTab === 'estadisticas' || activeTab === 'usuarios' || activeTab === 'admin';

  useEffect(() => {
    if (!moreOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [moreOpen]);

  const go = (tab: TabKey) => {
    setMoreOpen(false);
    onSelect(tab);
  };

  return (
    <>
      <nav
        style={{
          display: 'flex',
          background: colors.bgHeader,
          borderTop: `1px solid ${colors.border}`,
          padding: '8px 8px',
          paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
          gap: 4,
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 15,
        }}
      >
        {MOBILE_PILLS.map((pill) => {
          const isMore = pill.key === 'more';
          const active = isMore ? inMore : activeTab === pill.key;
          const isDentro = pill.key === 'dentro';
          const Icon = pill.Icon;
          const flex = active ? 2.6 : isDentro ? 1.35 : 1;
          const label = isMore
            ? activeTab === 'admin'
              ? 'Admin'
              : activeTab === 'usuarios'
                ? 'Usuarios'
                : activeTab === 'estadisticas'
                  ? 'Estadísticas'
                  : 'Más'
            : pill.label;

          return (
            <button
              key={pill.key}
              onClick={() => {
                if (pill.key === 'more') setMoreOpen(true);
                else onSelect(pill.key);
              }}
              aria-label={label}
              className="ui-btn ui-navtab"
              style={{
                flex,
                minWidth: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 7,
                border: 'none',
                borderRadius: 14,
                background: active ? colors.accentBgSoft : 'transparent',
                color: active ? colors.accent : colors.textMuted,
                cursor: 'pointer',
                padding: '0 10px',
                height: 52,
                overflow: 'hidden',
                position: 'relative',
                font: 'inherit',
                transition: 'flex .18s ease, background .15s, color .15s',
              }}
            >
              <span style={{ display: 'flex', flexShrink: 0 }}>
                <Icon size={21} strokeWidth={2} />
              </span>
              {active && (
                <span
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {label}
                </span>
              )}
              {isDentro && (
                <span
                  style={{
                    fontFamily: fonts.mono,
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '2px 7px',
                    borderRadius: 999,
                    background: activeTab === 'dentro' ? colors.accent : colors.bgInputAlt,
                    color: activeTab === 'dentro' ? colors.accentContrast : colors.textMuted,
                    flexShrink: 0,
                  }}
                >
                  {insideCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {moreOpen &&
        createPortal(
          <>
            <div
              onClick={() => setMoreOpen(false)}
              aria-hidden
              style={{
                position: 'fixed',
                inset: 0,
                zIndex: 699,
                background: 'rgba(8,9,11,0.55)',
                animation: 'backdropIn .2s ease-out both',
              }}
            />
            <div
              style={{
                position: 'fixed',
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: 700,
                background: colors.bg,
                borderRadius: '24px 24px 0 0',
                boxShadow: `0 -20px 50px ${colors.shadow}`,
                padding: '12px 18px calc(24px + env(safe-area-inset-bottom))',
                display: 'flex',
                flexDirection: 'column',
                gap: 14,
                animation: 'sheetUp .3s cubic-bezier(.16,1,.3,1) both',
              }}
            >
              <span
                style={{
                  width: 36,
                  height: 4,
                  borderRadius: 999,
                  background: colors.border,
                  alignSelf: 'center',
                }}
              />
              <div
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: colors.textDim,
                  padding: '0 2px',
                }}
              >
                Gestión
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <MoreSheetRow
                  active={activeTab === 'estadisticas'}
                  Icon={BarChart3}
                  title="Estadísticas"
                  subtitle="Actividad, ocupación y tendencias"
                  onClick={() => go('estadisticas')}
                />
                <MoreSheetRow
                  active={activeTab === 'usuarios'}
                  Icon={Users}
                  title="Usuarios"
                  subtitle="Operadores del sistema y su turno"
                  onClick={() => go('usuarios')}
                />
                {isAdmin && (
                  <MoreSheetRow
                    active={activeTab === 'admin'}
                    Icon={Settings}
                    title="Administración"
                    subtitle="Campos del formulario y PIN de acceso"
                    onClick={() => go('admin')}
                  />
                )}
              </div>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function MoreSheetRow({
  active,
  Icon,
  title,
  subtitle,
  onClick,
}: {
  active: boolean;
  Icon: ComponentType<{ size?: number; strokeWidth?: number }>;
  title: string;
  subtitle: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="ui-btn"
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 13,
        border: `1px solid ${active ? colors.accentBgBadge : colors.border}`,
        background: active ? colors.accentBgSofter : colors.bgCard,
        borderRadius: 14,
        padding: '14px 15px',
        cursor: 'pointer',
        textAlign: 'left',
        minHeight: 62,
        color: colors.textPrimary,
        font: 'inherit',
      }}
    >
      <span
        style={{
          width: 38,
          height: 38,
          borderRadius: 11,
          background: colors.accentBgSoft,
          color: colors.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={18} strokeWidth={1.9} />
      </span>
      <span style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
        <span style={{ fontSize: 15, fontWeight: 700 }}>{title}</span>
        <span style={{ fontSize: 11.5, color: colors.textMuted }}>{subtitle}</span>
      </span>
    </button>
  );
}
