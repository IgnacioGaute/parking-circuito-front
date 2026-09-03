import { colors } from '@/styles/theme';

interface LoadingSquaresProps {
  size?: number;
}

// Shown wherever a section is fetching its data — four squares pulsing in
// the system's accent color, staggered like a loading spinner. Pure CSS
// (.loading-square/@keyframes squarePulse in globals.css), so it animates
// without waiting on GSAP.
export function LoadingSquares({ size = 14 }: LoadingSquaresProps) {
  return (
    <div
      role="status"
      aria-label="Cargando"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(2, ${size}px)`,
        gap: Math.round(size * 0.4),
      }}
    >
      {[0, 1, 2, 3].map((i) => (
        <span
          key={i}
          className="loading-square"
          style={{
            width: size,
            height: size,
            borderRadius: Math.max(2, Math.round(size * 0.25)),
            background: colors.accent,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}
