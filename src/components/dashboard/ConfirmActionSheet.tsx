'use client';

import { X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { colors } from '@/styles/theme';

interface ConfirmActionSheetProps {
  title: string;
  description: string;
  confirmLabel: string;
  busyLabel: string;
  destructive?: boolean;
  extraContent?: ReactNode;
  busy: boolean;
  error: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmActionSheet({
  title,
  description,
  confirmLabel,
  busyLabel,
  destructive,
  extraContent,
  busy,
  error,
  onConfirm,
  onCancel,
}: ConfirmActionSheetProps) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && !busy) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel, busy]);

  // 'use client' components still render on the server for the initial
  // HTML, where `document` doesn't exist — createPortal(..., document.body)
  // would throw there.
  if (typeof document === 'undefined') return null;

  return createPortal(
    <>
      <div
        onClick={busy ? undefined : onCancel}
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 699,
          background: 'rgba(8,9,11,0.55)',
          animation: 'backdropIn .2s ease-out both',
        }}
      />
      <div
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          maxHeight: '70vh',
          zIndex: 700,
          background: colors.bg,
          borderRadius: '24px 24px 0 0',
          boxShadow: `0 -20px 50px ${colors.shadow}`,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          animation: 'sheetUp .32s cubic-bezier(.16,1,.3,1) both',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 10, flexShrink: 0 }}>
          <span style={{ width: 36, height: 4, borderRadius: 999, background: colors.border }} />
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 20px',
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 700, fontSize: 17 }}>{title}</div>
          <button
            onClick={onCancel}
            disabled={busy}
            aria-label="Cerrar"
            style={{
              width: 34,
              height: 34,
              border: `1px solid ${colors.border}`,
              borderRadius: 10,
              background: 'transparent',
              color: colors.textMuted,
              cursor: busy ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <X size={17} strokeWidth={2} />
          </button>
        </div>

        <div
          style={{
            minHeight: 0,
            overflowY: 'auto',
            padding: '4px 20px 20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div style={{ width: '100%', maxWidth: 420, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ margin: 0, fontSize: 13.5, color: colors.textMuted, lineHeight: 1.55 }}>
              {description}
            </p>

            {extraContent}

            {error && (
              <div style={{ fontSize: 12.5, fontWeight: 600, color: colors.error, textAlign: 'center' }}>
                {error}
              </div>
            )}
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            flexShrink: 0,
            borderTop: `1px solid ${colors.border}`,
            padding: '14px 20px calc(14px + env(safe-area-inset-bottom))',
          }}
        >
          <div style={{ width: '100%', maxWidth: 420, display: 'flex', gap: 10 }}>
            <button
              onClick={onCancel}
              disabled={busy}
              style={{
                flex: 1,
                border: `1px solid ${colors.border}`,
                background: 'transparent',
                color: colors.textMuted,
                cursor: busy ? 'default' : 'pointer',
                padding: 15,
                borderRadius: 12,
                font: 'inherit',
                fontWeight: 600,
                fontSize: 14,
                opacity: busy ? 0.5 : 1,
              }}
            >
              Volver
            </button>
            <button
              onClick={onConfirm}
              disabled={busy}
              style={{
                flex: 2,
                border: 'none',
                background: destructive ? colors.error : colors.accent,
                color: destructive ? '#fff' : colors.accentContrast,
                cursor: busy ? 'default' : 'pointer',
                padding: 15,
                borderRadius: 12,
                font: 'inherit',
                fontWeight: 700,
                fontSize: 14,
                opacity: busy ? 0.7 : 1,
              }}
            >
              {busy ? busyLabel : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
