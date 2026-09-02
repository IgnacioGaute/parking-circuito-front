'use client';

import { ChevronDown } from 'lucide-react';
import type { ComponentType } from 'react';
import { colors } from '@/styles/theme';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  Icon?: ComponentType<{ size?: number; strokeWidth?: number }>;
  // True when the selection narrows the default ("todos"/"todas") state —
  // the field picks up the accent so an active filter reads at a glance
  // instead of blending into the row with every other untouched control.
  active?: boolean;
  ariaLabel: string;
  minWidth?: number;
}

// Stays a native <select> on purpose — on mobile that's the OS's own
// picker sheet, which is easier to hit and more accessible than a custom
// dropdown would be. Only the closed-state trigger is themed: an optional
// leading icon, a consistent pill shape shared with SearchField, and an
// accent outline when the filter is actually narrowing something.
export function SelectField({ value, onChange, options, Icon, active, ariaLabel, minWidth }: SelectFieldProps) {
  return (
    <div style={{ position: 'relative', minWidth: minWidth ?? 0 }}>
      {Icon && (
        <span
          style={{
            position: 'absolute',
            left: 14,
            top: '50%',
            transform: 'translateY(-50%)',
            color: active ? colors.accent : colors.textDim,
            pointerEvents: 'none',
            display: 'flex',
          }}
        >
          <Icon size={15} strokeWidth={2} />
        </span>
      )}
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-label={ariaLabel}
        className="ui-input"
        style={{
          width: '100%',
          boxSizing: 'border-box',
          appearance: 'none',
          border: `1px solid ${active ? 'rgba(217,164,65,0.45)' : colors.border}`,
          background: active ? colors.accentBgSofter : colors.bgInput,
          borderRadius: 13,
          padding: `13px 34px 13px ${Icon ? 38 : 16}px`,
          font: 'inherit',
          fontSize: 15,
          fontWeight: 600,
          color: active ? colors.accentText : colors.textPrimary,
          outline: 'none',
          cursor: 'pointer',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={15}
        strokeWidth={2}
        style={{
          position: 'absolute',
          right: 12,
          top: '50%',
          transform: 'translateY(-50%)',
          color: active ? colors.accent : colors.textMuted,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
