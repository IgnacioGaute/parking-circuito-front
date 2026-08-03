'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
        borderRadius: 14,
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        boxShadow: `0 12px 32px ${colors.shadow}`,
        animation: 'fadeUp .2s ease both',
        pointerEvents: 'auto',
      }}
    >
      <div style={{ fontFamily: fonts.mono, fontSize: 11.5, color: colors.textDim }}>
        {stepIndex + 1} / {steps.length}
      </div>
      <div style={{ fontWeight: 700, fontSize: 16 }}>{step.title}</div>
      <div style={{ fontSize: 13.5, color: colors.textMuted, lineHeight: 1.5 }}>
        {step.description}
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
        <button
          onClick={onClose}
          style={{
            border: `1px solid ${colors.border}`,
            background: 'transparent',
            color: colors.textMuted,
            cursor: 'pointer',
            padding: '9px 14px',
            borderRadius: 10,
            font: 'inherit',
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          Salir
        </button>
        <div style={{ flex: 1 }} />
        {!isFirst && (
          <button
            onClick={onBack}
            style={{
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textPrimary,
              cursor: 'pointer',
              padding: '9px 14px',
              borderRadius: 10,
              font: 'inherit',
              fontWeight: 600,
              fontSize: 13,
            }}
          >
            Atrás
          </button>
        )}
        <button
          onClick={isLast ? onClose : onNext}
          style={{
            border: 'none',
            background: colors.accent,
            color: colors.accentContrast,
            cursor: 'pointer',
            padding: '9px 16px',
            borderRadius: 10,
            font: 'inherit',
            fontWeight: 700,
            fontSize: 13,
          }}
        >
          {isLast ? 'Finalizar' : 'Siguiente'}
        </button>
      </div>
    </div>
  );

  return createPortal(
    <>
      <div
        onClick={(event) => event.stopPropagation()}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 900,
          background: rect ? 'transparent' : 'rgba(8,9,11,0.72)',
        }}
      />
      {rect && (
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
      )}

      {cardOffset ? (
        <div style={{ position: 'fixed', zIndex: 901, ...cardOffset }}>{card}</div>
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
