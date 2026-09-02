'use client';

import { Search, X } from 'lucide-react';
import { colors } from '@/styles/theme';

interface SearchFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoFocus?: boolean;
  'data-tour'?: string;
}

// One search-input look for the whole app (Dentro, Historial, Frecuentes,
// the frequent-plate lookup in Registrar all pointed at the same
// icon+input markup, copy-pasted with small drifts — Frecuentes' copy was
// even missing the focus ring). A clear button appears once there's
// something to clear, sized as a real 32px touch target, not just its icon.
export function SearchField({ value, onChange, placeholder, autoFocus, ...rest }: SearchFieldProps) {
  return (
    <div style={{ position: 'relative' }} data-tour={rest['data-tour']}>
      <Search
        size={16}
        strokeWidth={2}
        style={{
          position: 'absolute',
          left: 14,
          top: '50%',
          transform: 'translateY(-50%)',
          color: colors.textDim,
          pointerEvents: 'none',
        }}
      />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        className="ui-input"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          border: `1px solid ${colors.border}`,
          background: colors.bgInput,
          borderRadius: 13,
          padding: `13px ${value ? 40 : 16}px 13px 40px`,
          font: 'inherit',
          fontSize: 16,
          outline: 'none',
          color: colors.textPrimary,
        }}
      />
      {value && (
        <button
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="ui-btn"
          style={{
            position: 'absolute',
            right: 6,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 32,
            height: 32,
            border: 'none',
            background: 'transparent',
            color: colors.textDim,
            cursor: 'pointer',
            borderRadius: 9,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={15} strokeWidth={2.2} />
        </button>
      )}
    </div>
  );
}
