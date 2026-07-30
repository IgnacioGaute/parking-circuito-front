'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/lib/use-theme';
import { colors } from '@/styles/theme';

interface ThemeToggleProps {
  style?: React.CSSProperties;
}

export function ThemeToggle({ style }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isLight = theme === 'light';

  return (
    <button
      onClick={toggleTheme}
      aria-label={isLight ? 'Cambiar a tema oscuro' : 'Cambiar a tema claro'}
      title={isLight ? 'Tema oscuro' : 'Tema claro'}
      style={{
        width: 34,
        height: 34,
        borderRadius: 9,
        border: `1px solid ${colors.border}`,
        background: colors.bgCard,
        color: colors.textMuted,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        flexShrink: 0,
        padding: 0,
        transition: 'color .15s ease, border-color .15s ease',
        ...style,
      }}
    >
      {isLight ? <Moon size={16} strokeWidth={2} /> : <Sun size={16} strokeWidth={2} />}
    </button>
  );
}
