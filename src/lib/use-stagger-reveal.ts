'use client';

import gsap from 'gsap';
import { useLayoutEffect, useRef } from 'react';
import { prefersReducedMotion } from './motion';

// Shared entrance for a list/grid of cards — every list tab in the app was
// fading in as one flat block (`animation: fadeUp .3s both` on the root),
// so a screen with 12 cards popped in as a single slab instead of reading
// as 12 things arriving. This staggers the same rise-and-fade per item.
// Pass a signature that changes whenever the item SET changes (ids/length,
// not values) — re-running on every keystroke of a search filter would be
// noisy, not a feature.
export function useStaggerReveal<T extends HTMLElement>(selector: string, signature: string) {
  const containerRef = useRef<T>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || prefersReducedMotion()) return;
    const items = el.querySelectorAll<HTMLElement>(selector);
    if (items.length === 0) return;
    const tween = gsap.fromTo(
      items,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out', stagger: Math.min(0.05, 0.4 / items.length) },
    );
    return () => {
      tween.kill();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature]);

  return containerRef;
}
