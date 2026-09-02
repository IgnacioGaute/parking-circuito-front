'use client';

import { useEffect, useState } from 'react';
import { getSettingsAction, updateSettingsAction } from '@/actions/settings.actions';
import { colors } from '@/styles/theme';

interface SettingsAdminPanelProps {
  onToast: (message: string) => void;
}

const inputStyle: React.CSSProperties = {
  border: `1px solid ${colors.border}`,
  background: colors.bgInput,
  borderRadius: 10,
  padding: '11px 14px',
  font: 'inherit',
  fontSize: 16,
  color: colors.textPrimary,
  outline: 'none',
};

export function SettingsAdminPanel({ onToast }: SettingsAdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [minutes, setMinutes] = useState('60');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettingsAction()
      .then((settings) => setMinutes(String(settings.alertThresholdMinutes)))
      .catch(() => onToast('No se pudo cargar la configuración'))
      .finally(() => setLoading(false));
    // onToast is stable across renders in this app (defined once via useToast),
    // so omitting it keeps this to a real mount-only fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const parsed = Number(minutes);
  const valid = Number.isInteger(parsed) && parsed >= 1 && parsed <= 1440;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await updateSettingsAction({ alertThresholdMinutes: parsed });
      onToast('Configuración guardada');
    } catch {
      setError('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-tour="admin-alertas" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>Alerta de tiempo dentro</div>
        <div style={{ fontSize: 12.5, color: colors.textDim, marginTop: 4 }}>
          Un vehículo se marca &quot;Atención&quot; en la pestaña Dentro cuando lleva más
          de este tiempo sin registrar salida.
        </div>
      </div>

      {loading ? (
        <div style={{ color: colors.textDim, fontSize: 13 }}>Cargando…</div>
      ) : (
        <div
          style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: 14,
            padding: 18,
            display: 'flex',
            gap: 10,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 7, flex: 1, minWidth: 160 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>
              Minutos dentro antes de la alerta
            </span>
            <input
              type="number"
              min={1}
              max={1440}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
              style={inputStyle}
            />
          </label>
          <button
            onClick={handleSave}
            disabled={saving || !valid}
            style={{
              border: 'none',
              background: !valid ? colors.accentDisabledBg : colors.accent,
              color: colors.accentContrast,
              cursor: valid ? 'pointer' : 'default',
              padding: '11px 20px',
              borderRadius: 10,
              font: 'inherit',
              fontWeight: 700,
              fontSize: 14,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? 'Guardando…' : 'Guardar'}
          </button>
          {!valid && (
            <div style={{ width: '100%', color: colors.error, fontSize: 12.5 }}>
              Ingresá un número entero entre 1 y 1440 minutos.
            </div>
          )}
          {error && (
            <div style={{ width: '100%', color: colors.error, fontSize: 12.5 }}>{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
