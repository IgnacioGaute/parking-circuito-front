'use client';

import { Car, List, Plus, Settings, Users } from 'lucide-react';
import type { ComponentType } from 'react';
import { colors } from '@/styles/theme';

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
    { key: 'registrar', label: 'Registrar', Icon: Plus, badge: null },
    { key: 'dentro', label: 'Dentro', Icon: Car, badge: insideCount || null },
    { key: 'historial', label: 'Historial', Icon: List, badge: null },
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
              borderTop: isDesktop
                ? 'none'
                : active
                  ? `2px solid ${colors.accent}`
                  : '2px solid transparent',
              borderLeft: isDesktop
                ? active
                  ? `2px solid ${colors.accent}`
                  : '2px solid transparent'
                : 'none',
              cursor: 'pointer',
              padding: isDesktop ? '12px 14px' : '9px 4px 7px',
              background: 'transparent',
              color: active ? colors.accent : colors.textMuted,
              transition: 'color .15s,border-color .15s',
              font: 'inherit',
              position: 'relative',
            }}
          >
            <Icon size={isDesktop ? 17 : 19} strokeWidth={2} />
            <span style={{ fontSize: isDesktop ? 14 : 10.5, fontWeight: 600 }}>{tab.label}</span>
            {tab.badge != null && (
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
