'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { colors } from '@/styles/theme';

export type SuccessOverlayPhase = 'success' | 'closing';

interface SuccessOverlayProps {
  phase: SuccessOverlayPhase;
  // 'error' swaps the ring/badge/icon to red and draws an "X" instead of a
  // checkmark — everything else (timing, layout, the rising-wave backdrop)
  // is shared, so a failed registration reads as the same moment, not a
  // different, disconnected UI.
  variant?: 'success' | 'error';
  title: string;
  subtitle: string;
  // Optional second line under subtitle, e.g. since when the conflicting
  // vehicle has been inside — dimmer than subtitle, only used by 'error'.
  detail?: string;
}

// The "risen wave" full-screen confirmation shown after registering an
// entrada or an exit — shared by EntradaForm and DentroTab's exit sheet so
// the one animation upgrade lands both places. Callers own the phase
// timing (success → hold → closing → unmount); this only owns what plays
// inside each phase, never when phases change.
export function SuccessOverlay({ phase, variant = 'success', title, subtitle, detail }: SuccessOverlayProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const iconRef = useRef<SVGPathElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const isError = variant === 'error';
  const accent = isError ? colors.error : colors.green;
  const accentBgSoft = isError ? colors.errorBgSoft : colors.greenBgSoft;
  // Checkmark for success; an "X" (two crossing strokes) for error — both
  // paths draw with the same total-length dasharray reveal below.
  const iconPath = isError ? 'M8 8l8 8M16 8l-8 8' : 'm5 13 4 4 10-10';

  useEffect(() => {
    if (phase !== 'success') return;
    const ring = ringRef.current;
    const badge = badgeRef.current;
    const icon = iconRef.current;
    const text = textRef.current;
    if (!ring || !badge || !icon || !text) return;

    if (prefersReducedMotion()) {
      gsap.set([ring, badge, text], { clearProps: 'all' });
      icon.style.strokeDasharray = '';
      icon.style.strokeDashoffset = '0';
      return;
    }

    const len = icon.getTotalLength();
    icon.style.strokeDasharray = `${len}`;
    icon.style.strokeDashoffset = `${len}`;

    gsap.set(badge, { scale: 0 });
    gsap.set(ring, { scale: 0.6, opacity: 0.55 });
    gsap.set(text, { opacity: 0, y: 10 });

    const tl = gsap.timeline({ delay: 0.05 });
    // Badge lands with a felt-not-seen overshoot (spring register, ~1-1.5%)
    // rather than the cartoon-y default back.out — a confirmation moment
    // reads as reassuring, not playful.
    tl.to(badge, { scale: 1, duration: 0.5, ease: 'back.out(1.15)' }, 0)
      .to(ring, { scale: 1.9, opacity: 0, duration: 0.75, ease: 'power2.out' }, 0)
      .to(icon, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }, 0.3)
      .to(text, { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, 0.38);

    return () => {
      tl.kill();
    };
  }, [phase]);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 800,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0,
          bottom: 0,
          width: '100%',
          background: `linear-gradient(180deg, ${colors.bgCard}, ${colors.bg})`,
          animation:
            phase === 'closing'
              ? 'waveDrain .8s cubic-bezier(.65,0,.35,1) forwards'
              : 'waveFill .8s cubic-bezier(.65,0,.35,1) forwards',
        }}
      />
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 18,
          padding: '0 32px',
          animation: phase === 'closing' ? 'fadeOutFast .25s ease forwards' : 'none',
        }}
      >
        <div style={{ position: 'relative', width: 64, height: 64, flexShrink: 0 }}>
          <div
            ref={ringRef}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${accent}`,
            }}
          />
          <div
            ref={badgeRef}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: accentBgSoft,
              color: accent,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path
                ref={iconRef}
                d={iconPath}
                stroke={accent}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div
          ref={textRef}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 6,
            textAlign: 'center',
            maxWidth: 340,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 20, color: colors.textPrimary }}>{title}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted, lineHeight: 1.4 }}>
            {subtitle}
          </div>
          {detail && (
            <div style={{ fontSize: 12, color: colors.textDim, lineHeight: 1.4 }}>{detail}</div>
          )}
        </div>
      </div>
    </div>
  );
}
