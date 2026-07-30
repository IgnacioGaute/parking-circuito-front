'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { clearActiveOperator } from '@/lib/active-operator';
import { colors, fonts } from '@/styles/theme';

interface HeaderProps {
  operatorName: string;
}

export function Header({ operatorName }: HeaderProps) {
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

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        background: colors.bgHeader,
        borderRadius: '0 0 22px 22px',
        boxShadow: `0 10px 28px ${colors.shadow}`,
        padding: '14px 20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        animation: 'fadeUp .45s both',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, minWidth: 0 }}>
          <div
            style={{
              width: 36,
              height: 36,
              flexShrink: 0,
              background: colors.accent,
              clipPath: 'polygon(0 0,100% 0,100% 70%,70% 100%,0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div
              style={{
                width: 22,
                height: 4.5,
                background: colors.accentContrast,
                transform: 'rotate(-24deg)',
                borderRadius: 2,
              }}
            />
          </div>
          <div
            style={{
              fontFamily: fonts.display,
              fontWeight: 800,
              fontSize: 17,
              letterSpacing: '0.03em',
              textTransform: 'uppercase',
              lineHeight: 1.15,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            Control de Estacionamiento
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <div
            style={{
              textAlign: 'right',
              background: colors.bgInputAlt,
              borderRadius: 12,
              padding: '5px 12px',
              lineHeight: 1.2,
            }}
          >
            <div
              style={{
                fontFamily: fonts.display,
                fontSize: 16,
                fontWeight: 800,
                fontVariantNumeric: 'tabular-nums',
                letterSpacing: '0.02em',
              }}
            >
              {now
                ? now.toLocaleTimeString('es', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })
                : '--:--:--'}
            </div>
            <div
              style={{
                fontSize: 9,
                color: colors.textDim,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginTop: 1,
              }}
            >
              {now
                ? now.toLocaleDateString('es', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                  })
                : ''}
            </div>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            background: colors.bgInputAlt,
            borderRadius: 999,
            padding: '6px 12px 6px 10px',
            minWidth: 0,
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
              fontSize: 10.5,
              color: colors.textMuted,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              flexShrink: 0,
            }}
          >
            En turno
          </span>
          <span
            style={{
              fontWeight: 700,
              color: colors.accentText,
              fontSize: 12,
              letterSpacing: '0.02em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {operatorName}
          </span>
        </div>

        <button
          onClick={handleChange}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            border: `1.5px solid ${colors.border}`,
            background: 'transparent',
            color: colors.textMuted,
            borderRadius: 999,
            padding: '6px 14px',
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <LogOut size={13} strokeWidth={2.2} />
          Cambiar turno
        </button>
      </div>
    </header>
  );
}
