'use client';

import {
  Car,
  List,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  Settings,
  Star,
  Users,
} from 'lucide-react';
import type { ComponentType } from 'react';
import { colors } from '@/styles/theme';

export type TabKey = 'registrar' | 'dentro' | 'frecuentes' | 'historial' | 'usuarios' | 'admin';

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
  const tabs: TabDef[] = [
    { key: 'registrar', label: 'Registrar', Icon: Plus, badge: null },
    { key: 'dentro', label: 'Dentro', Icon: Car, badge: insideCount || null },
    { key: 'frecuentes', label: 'Frecuentes', Icon: Star, badge: null },
    { key: 'historial', label: 'Historial', Icon: List, badge: null },
    { key: 'usuarios', label: 'Usuarios', Icon: Users, badge: null },
    ...(isAdmin
      ? [{ key: 'admin' as const, label: 'Admin', Icon: Settings, badge: null }]
      : []),
  ];

  // Collapse only ever applies on desktop — the mobile bottom bar always
  // shows icon+label, there's nothing to collapse there.
  const rail = isDesktop && collapsed;

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
        }}
      >
        {tabs.map((tab) => {
          const active = activeTab === tab.key;
          const Icon = tab.Icon;
          return (
            <button
              key={tab.key}
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
                background: isDesktop && active
                  ? colors.accentBgSoft
                  : !isDesktop && active
                    ? colors.accentBgSofter
                    : 'transparent',
                boxShadow: isDesktop && active ? `inset 3px 0 0 ${colors.accent}` : 'none',
                color: active ? colors.accent : colors.textMuted,
                transition: 'color .15s, background .15s, box-shadow .15s',
                font: 'inherit',
                position: 'relative',
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
