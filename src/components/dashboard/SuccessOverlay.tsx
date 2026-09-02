'use client';

import gsap from 'gsap';
import { useEffect, useRef } from 'react';
import { prefersReducedMotion } from '@/lib/motion';
import { colors } from '@/styles/theme';

export type SuccessOverlayPhase = 'success' | 'closing';

interface SuccessOverlayProps {
  phase: SuccessOverlayPhase;
  title: string;
  subtitle: string;
}

// The "risen wave" full-screen confirmation shown after registering an
// entrada or an exit — shared by EntradaForm and DentroTab's exit sheet so
// the one animation upgrade lands both places. Callers own the phase
// timing (success → hold → closing → unmount); this only owns what plays
// inside each phase, never when phases change.
export function SuccessOverlay({ phase, title, subtitle }: SuccessOverlayProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const badgeRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<SVGPathElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (phase !== 'success') return;
    const ring = ringRef.current;
    const badge = badgeRef.current;
    const check = checkRef.current;
    const text = textRef.current;
    if (!ring || !badge || !check || !text) return;

    if (prefersReducedMotion()) {
      gsap.set([ring, badge, text], { clearProps: 'all' });
      check.style.strokeDasharray = '';
      check.style.strokeDashoffset = '0';
      return;
    }

    const len = check.getTotalLength();
    check.style.strokeDasharray = `${len}`;
    check.style.strokeDashoffset = `${len}`;

    gsap.set(badge, { scale: 0 });
    gsap.set(ring, { scale: 0.6, opacity: 0.55 });
    gsap.set(text, { opacity: 0, y: 10 });

    const tl = gsap.timeline({ delay: 0.05 });
    // Badge lands with a felt-not-seen overshoot (spring register, ~1-1.5%)
    // rather than the cartoon-y default back.out — a confirmation moment
    // reads as reassuring, not playful.
    tl.to(badge, { scale: 1, duration: 0.5, ease: 'back.out(1.15)' }, 0)
      .to(ring, { scale: 1.9, opacity: 0, duration: 0.75, ease: 'power2.out' }, 0)
      .to(check, { strokeDashoffset: 0, duration: 0.35, ease: 'power2.out' }, 0.3)
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
          animation: phase === 'closing' ? 'fadeOutFast .25s ease forwards' : 'none',
        }}
      >
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <div
            ref={ringRef}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              border: `2px solid ${colors.green}`,
            }}
          />
          <div
            ref={badgeRef}
            style={{
              position: 'absolute',
              inset: 0,
              borderRadius: '50%',
              background: colors.greenBgSoft,
              color: colors.green,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none">
              <path
                ref={checkRef}
                d="m5 13 4 4 10-10"
                stroke={colors.green}
                strokeWidth="2.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
        <div ref={textRef} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontWeight: 700, fontSize: 20, color: colors.textPrimary }}>{title}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: colors.textMuted }}>{subtitle}</div>
        </div>
      </div>
    </div>
  );
}
