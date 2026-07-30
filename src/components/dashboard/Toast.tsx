import { colors } from '@/styles/theme';

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div
      style={{
        position: 'fixed',
        left: '50%',
        bottom: 24,
        transform: 'translateX(-50%)',
        background: colors.bgCard,
        borderLeft: `4px solid ${colors.accent}`,
        color: colors.textPrimary,
        padding: '13px 22px',
        borderRadius: 10,
        fontSize: 13.5,
        fontWeight: 600,
        boxShadow: `0 12px 32px ${colors.shadow}`,
        animation: 'toastIn .2s ease-out',
        zIndex: 50,
      }}
    >
      {message}
    </div>
  );
}
