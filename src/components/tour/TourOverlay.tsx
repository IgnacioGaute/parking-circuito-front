'use client';

import gsap from 'gsap';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { prefersReducedMotion } from '@/lib/motion';
import type { TourStep } from '@/lib/tour-steps';
import { colors, fonts } from '@/styles/theme';

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface TourOverlayProps {
  steps: TourStep[];
  stepIndex: number;
  onNext: () => void;
  onBack: () => void;
  onClose: () => void;
}

const PAD = 8;
const CARD_WIDTH = 340;
const ASSUMED_CARD_HEIGHT = 260;
const MAX_FIND_ATTEMPTS = 30;

export function TourOverlay({ steps, stepIndex, onNext, onBack, onClose }: TourOverlayProps) {
  const step = steps[stepIndex];
  const [rect, setRect] = useState<Rect | null>(null);

  // Clear the old spotlight immediately on step change (adjusted during
  // render, React's documented pattern for this, rather than as the first
  // line of the effect below — avoids an extra cascading render) so it
  // doesn't linger while the effect looks for the new step's target.
  const [rectForStep, setRectForStep] = useState(stepIndex);
  if (stepIndex !== rectForStep) {
    setRectForStep(stepIndex);
    setRect(null);
  }

  // Re-locate and keep tracking the current step's target element — tabs
  // (and, for admin steps, the Operadores/Campos sub-section) switch
  // underneath this overlay, so the element the selector matches doesn't
  // exist in the DOM until that switch has actually rendered.
  useEffect(() => {
    if (!step.target) return;

    let cancelled = false;
    let raf = 0;
    let attempts = 0;
    let target: Element | null = null;

    const updateRect = () => {
      if (!target) return;
      const r = target.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height });
    };

    const findTarget = () => {
      if (cancelled) return;
      const el = document.querySelector(step.target!);
      if (el) {
        target = el;
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        updateRect();
      } else if (attempts < MAX_FIND_ATTEMPTS) {
        attempts += 1;
        raf = requestAnimationFrame(findTarget);
      }
    };

    findTarget();
    // Covers the smooth-scroll settling and the tab's own enter animation
    // shifting layout, without wiring up more precise per-cause listeners.
    const interval = setInterval(updateRect, 300);
    window.addEventListener('scroll', updateRect, true);
    window.addEventListener('resize', updateRect);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      clearInterval(interval);
      window.removeEventListener('scroll', updateRect, true);
      window.removeEventListener('resize', updateRect);
    };
  }, [stepIndex, step.target]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Content crossfade on step change — title/description/dots used to just
  // swap text instantly inside the same card shell. Skips its own first
  // run (the card's own fadeUp entrance already covers first paint).
  const bodyRef = useRef<HTMLDivElement>(null);
  const mountedRef = useRef(false);
  useLayoutEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    if (!mountedRef.current) {
      mountedRef.current = true;
      return;
    }
    if (prefersReducedMotion()) return;
    const tween = gsap.fromTo(
      el,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.28, ease: 'power2.out' },
    );
    return () => {
      tween.kill();
    };
  }, [stepIndex]);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === steps.length - 1;

  // Fixed-position offset when a target is spotlighted; `null` means "no
  // target, center the card" — handled by wrapping it in a flex-centered
  // container below instead of a `transform` trick, since the card's own
  // `fadeUp` entrance animation also drives `transform` and would otherwise
  // clobber a static centering transform applied to the same element.
  const cardOffset: React.CSSProperties | null = rect
    ? (() => {
        const spaceBelow = window.innerHeight - (rect.top + rect.height);
        const placeBelow = spaceBelow > 200 || spaceBelow > rect.top;
        const left = Math.min(
          Math.max(rect.left + rect.width / 2 - CARD_WIDTH / 2, 16),
          window.innerWidth - CARD_WIDTH - 16,
        );
        // Targets taller than the viewport (a long list, scrolled to
        // center) can push the naive "just below/above the rect" position
        // off-screen — clamp so the card always stays within view even
        // then, even though it may end up overlapping the spotlight.
        return placeBelow
          ? { top: Math.max(16, Math.min(rect.top + rect.height + PAD + 12, window.innerHeight - ASSUMED_CARD_HEIGHT - 16)), left }
          : { bottom: Math.max(16, Math.min(window.innerHeight - rect.top + PAD + 12, window.innerHeight - ASSUMED_CARD_HEIGHT - 16)), left };
      })()
    : null;

  const card = (
    <div
      style={{
        width: CARD_WIDTH,
        maxWidth: 'calc(100vw - 32px)',
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        boxShadow: `0 16px 40px ${colors.shadow}`,
        animation: 'fadeUp .25s ease both',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {steps.map((s, i) => (
            <span
              key={s.id}
              aria-hidden
              style={{
                height: 5,
                width: i === stepIndex ? 16 : 5,
                borderRadius: 999,
                background: i === stepIndex ? colors.accent : colors.border,
                transition: 'width .2s ease, background-color .2s ease',
              }}
            />
          ))}
          <span style={{ fontFamily: fonts.mono, fontSize: 10.5, color: colors.textDim, marginLeft: 4 }}>
            {stepIndex + 1}/{steps.length}
          </span>
        </div>
        <button
          onClick={onClose}
          aria-label="Salir del recorrido"
          title="Salir"
          className="ui-btn ui-ghost"
          style={{
            width: 28,
            height: 28,
            flexShrink: 0,
            border: `1px solid ${colors.border}`,
            borderRadius: 8,
            background: 'transparent',
            color: colors.textMuted,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={14} strokeWidth={2.2} />
        </button>
      </div>

      <div ref={bodyRef} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 16 }}>{step.title}</div>
        <div style={{ fontSize: 13.5, color: colors.textMuted, lineHeight: 1.5 }}>
          {step.description}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        {!isFirst && (
          <button
            onClick={onBack}
            className="ui-btn"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textPrimary,
              cursor: 'pointer',
              padding: '10px 14px',
              borderRadius: 11,
              font: 'inherit',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            <ArrowLeft size={14} strokeWidth={2.3} />
            Atrás
          </button>
        )}
        <div style={{ flex: 1 }} />
        <button
          onClick={isLast ? onClose : onNext}
          className="ui-btn ui-cta"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            border: 'none',
            background: colors.accent,
            color: colors.accentContrast,
            cursor: 'pointer',
            padding: '10px 16px',
            borderRadius: 11,
            font: 'inherit',
            fontWeight: 700,
            fontSize: 13,
            boxShadow: '0 4px 12px -3px rgba(217,164,65,0.5)',
          }}
        >
          {isLast ? (
            <>
              <Check size={14} strokeWidth={2.5} />
              Finalizar
            </>
          ) : (
            <>
              Siguiente
              <ArrowRight size={14} strokeWidth={2.3} />
            </>
          )}
        </button>
      </div>
    </div>
  );

  // 'use client' components still render on the server for the initial
  // HTML, where `document` doesn't exist — createPortal(..., document.body)
  // would throw there.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 900,
          background: rect ? 'transparent' : 'rgba(8,9,11,0.72)',
          transition: 'background-color .25s ease',
        }}
      />
      {rect && (
        <>
          <div
            aria-hidden
            style={{
              position: 'fixed',
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              borderRadius: 14,
              border: `2px solid ${colors.accent}`,
              pointerEvents: 'none',
              zIndex: 900,
              opacity: 0.9,
              animation: prefersReducedMotion() ? 'none' : 'tourPing 1.8s ease-out infinite',
            }}
          />
          <div
            style={{
              position: 'fixed',
              top: rect.top - PAD,
              left: rect.left - PAD,
              width: rect.width + PAD * 2,
              height: rect.height + PAD * 2,
              borderRadius: 14,
              boxShadow: `0 0 0 3px ${colors.accent}, 0 0 0 9999px rgba(8,9,11,0.72)`,
              pointerEvents: 'none',
              zIndex: 900,
              transition: 'top .2s ease, left .2s ease, width .2s ease, height .2s ease',
            }}
          />
        </>
      )}

      {cardOffset ? (
        <div style={{ position: 'fixed', zIndex: 901, ...cardOffset, transition: 'top .2s ease, bottom .2s ease, left .2s ease' }}>
          {card}
        </div>
      ) : (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 901,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none',
          }}
        >
          {card}
        </div>
      )}
    </>,
    document.body,
  );
}
