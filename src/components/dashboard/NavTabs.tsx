'use client';

import { ClipboardList, History, LayoutGrid, Settings, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { colors, fonts } from '@/styles/theme';

export type TabKey = 'registrar' | 'dentro' | 'historial' | 'usuarios' | 'admin';

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
}

export function NavTabs({ isDesktop, activeTab, insideCount, isAdmin, onSelect }: NavTabsProps) {
  const tabs: TabDef[] = [
    { key: 'registrar', label: 'Registrar', Icon: ClipboardList, badge: null },
    { key: 'dentro', label: 'Dentro', Icon: LayoutGrid, badge: insideCount || null },
    { key: 'historial', label: 'Historial', Icon: History, badge: null },
    { key: 'usuarios', label: 'Usuarios', Icon: Users, badge: null },
    ...(isAdmin
      ? [{ key: 'admin' as const, label: 'Admin', Icon: Settings, badge: null }]
      : []),
  ];

  return (
    <nav
      style={{
        display: 'flex',
        flexDirection: isDesktop ? 'column' : 'row',
        background: colors.bgHeader,
        borderBottom: isDesktop ? 'none' : `1px solid ${colors.border}`,
        borderRight: isDesktop ? `1px solid ${colors.border}` : 'none',
        borderTop: isDesktop ? 'none' : `1px solid ${colors.border}`,
        width: isDesktop ? 240 : '100%',
        flexShrink: 0,
        padding: isDesktop ? '18px 10px' : '4px 4px',
        paddingBottom: isDesktop ? 18 : 'calc(4px + env(safe-area-inset-bottom))',
        gap: isDesktop ? 4 : 2,
        position: isDesktop ? 'sticky' : 'fixed',
        top: isDesktop ? 105 : 'auto',
        bottom: isDesktop ? 'auto' : 0,
        left: 0,
        right: 0,
        zIndex: 15,
        alignSelf: 'flex-start',
      }}
    >
      {tabs.map((tab) => {
        const active = activeTab === tab.key;
        const Icon = tab.Icon;
        return (
          <button
            key={tab.key}
            onClick={() => onSelect(tab.key)}
            style={{
              flex: isDesktop ? 'none' : 1,
              display: 'flex',
              flexDirection: isDesktop ? 'row' : 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isDesktop ? 9 : 3,
              border: 'none',
              borderRadius: isDesktop ? 10 : 12,
              borderBottom: isDesktop
                ? 'none'
                : active
                  ? `3px solid ${colors.accent}`
                  : '3px solid transparent',
              cursor: 'pointer',
              padding: isDesktop ? '12px 14px' : '7px 4px',
              background: active ? colors.accentBgSoft : 'transparent',
              color: active ? colors.accentText : colors.textMuted,
              transition: 'color .15s,background .15s',
              font: 'inherit',
              position: 'relative',
            }}
          >
            <Icon size={isDesktop ? 17 : 19} strokeWidth={active ? 2.3 : 1.8} />
            <span
              style={{
                fontFamily: fonts.display,
                fontSize: isDesktop ? 15 : 10.5,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.04em',
              }}
            >
              {tab.label}
            </span>
            {tab.badge != null && (
              <span
                style={{
                  position: isDesktop ? 'static' : 'absolute',
                  top: isDesktop ? 'auto' : 2,
                  right: isDesktop ? 'auto' : 14,
                  background: active ? colors.accentBgBadge : colors.border,
                  color: active ? colors.accentText : colors.textPrimary,
                  fontSize: 10.5,
                  fontWeight: 700,
                  padding: '1px 7px',
                  borderRadius: 999,
                  minWidth: 17,
                  textAlign: 'center',
                  lineHeight: 1.4,
                }}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
