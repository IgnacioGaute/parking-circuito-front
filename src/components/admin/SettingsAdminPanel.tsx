'use client';

import gsap from 'gsap';
import { Bell, Check } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { getSettingsAction, updateSettingsAction } from '@/actions/settings.actions';
import { LoadingSquares } from '@/components/ui/LoadingSquares';
import { formatDuration } from '@/lib/format';
import { prefersReducedMotion } from '@/lib/motion';
import { colors } from '@/styles/theme';

interface SettingsAdminPanelProps {
  onToast: (message: string) => void;
}

const MIN_MINUTES = 1;
const MAX_MINUTES = 1440;

// Common thresholds an operator would actually pick, so setting this up is
// usually one tap instead of typing a number.
const PRESETS = [15, 30, 60, 90, 120, 180];

export function SettingsAdminPanel({ onToast }: SettingsAdminPanelProps) {
  const [loading, setLoading] = useState(true);
  const [minutes, setMinutes] = useState('60');
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [togglingAlerts, setTogglingAlerts] = useState(false);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const saveBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    getSettingsAction()
      .then((settings) => {
        setMinutes(String(settings.alertThresholdMinutes));
        setAlertsEnabled(settings.alertsEnabled);
      })
      .catch(() => onToast('No se pudo cargar la configuración'))
      .finally(() => setLoading(false));
    // onToast is stable across renders in this app (defined once via useToast),
    // so omitting it keeps this to a real mount-only fetch.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // A toggle, not a form field — it saves the instant it's flipped instead
  // of waiting for "Guardar" below (that button only ever touches the
  // minutes value). Optimistic: flips immediately, reverts on failure.
  const handleToggleAlerts = async () => {
    const next = !alertsEnabled;
    setAlertsEnabled(next);
    setTogglingAlerts(true);
    try {
      await updateSettingsAction({ alertsEnabled: next });
      onToast(next ? 'Alertas activadas' : 'Alertas desactivadas');
    } catch {
      setAlertsEnabled(!next);
      onToast('No se pudo cambiar el estado de las alertas');
    } finally {
      setTogglingAlerts(false);
    }
  };

  useEffect(() => {
    if (loading || prefersReducedMotion() || !cardRef.current) return;
    gsap.fromTo(
      cardRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' },
    );
  }, [loading]);

  const parsed = Number(minutes);
  const valid = Number.isInteger(parsed) && parsed >= MIN_MINUTES && parsed <= MAX_MINUTES;

  const handleSave = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    setJustSaved(false);
    try {
      await updateSettingsAction({ alertThresholdMinutes: parsed });
      onToast('Configuración guardada');
      setJustSaved(true);
      if (!prefersReducedMotion() && saveBtnRef.current) {
        gsap.fromTo(
          saveBtnRef.current,
          { scale: 1 },
          { keyframes: { scale: [1.05, 1] }, duration: 0.4, ease: 'back.out(2)' },
        );
      }
      setTimeout(() => setJustSaved(false), 1800);
    } catch {
      setError('No se pudo guardar la configuración');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-tour="admin-alertas" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span
          style={{
            width: 40,
            height: 40,
            borderRadius: 11,
            background: colors.errorBgSoft,
            color: colors.error,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Bell size={19} strokeWidth={2} />
        </span>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700 }}>Alerta de tiempo dentro</div>
          <div style={{ fontSize: 12.5, color: colors.textDim, marginTop: 2 }}>
            Un vehículo se marca &quot;Atención&quot; en la pestaña Dentro cuando lleva más de
            este tiempo sin registrar salida.
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '24px 0' }}>
          <LoadingSquares />
        </div>
      ) : (
        <div
          ref={cardRef}
          style={{
            background: colors.bgCard,
            border: `1px solid ${colors.border}`,
            borderRadius: 16,
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 18,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              border: `1px solid ${alertsEnabled ? colors.border : colors.borderDashed}`,
              borderRadius: 13,
              padding: '13px 14px',
            }}
          >
            <button
              type="button"
              onClick={handleToggleAlerts}
              disabled={togglingAlerts}
              className="ui-btn"
              aria-pressed={alertsEnabled}
              aria-label={alertsEnabled ? 'Desactivar alertas' : 'Activar alertas'}
              style={{
                position: 'relative',
                flexShrink: 0,
                width: 40,
                height: 23,
                borderRadius: 999,
                border: 'none',
                padding: 0,
                cursor: togglingAlerts ? 'default' : 'pointer',
                background: alertsEnabled ? colors.accent : colors.bgInputAlt,
                opacity: togglingAlerts ? 0.7 : 1,
                transition: 'background .18s ease',
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: 2.5,
                  left: 2.5,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  transform: alertsEnabled ? 'translateX(17px)' : 'translateX(0)',
                  transition: 'transform .22s cubic-bezier(.4,0,.2,1)',
                }}
              />
            </button>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13.5, fontWeight: 700 }}>
                {alertsEnabled ? 'Alertas activadas' : 'Alertas desactivadas'}
              </div>
              <div style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                {alertsEnabled
                  ? 'Un vehículo se marca "Atención" al superar el tiempo configurado abajo.'
                  : 'Ningún vehículo se va a marcar "Atención", sin importar cuánto tiempo lleve dentro.'}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 18,
              opacity: alertsEnabled ? 1 : 0.45,
              pointerEvents: alertsEnabled ? 'auto' : 'none',
              transition: 'opacity .15s ease',
            }}
          >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>
              Presets rápidos
            </span>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PRESETS.map((preset) => {
                const active = parsed === preset;
                return (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setMinutes(String(preset))}
                    className="ui-btn"
                    style={{
                      border: `1px solid ${active ? colors.accent : colors.border}`,
                      background: active ? colors.accentBgSoft : 'transparent',
                      color: active ? colors.accentText : colors.textMuted,
                      cursor: 'pointer',
                      padding: '7px 14px',
                      borderRadius: 999,
                      font: 'inherit',
                      fontWeight: 700,
                      fontSize: 12.5,
                    }}
                  >
                    {formatDuration(preset * 60_000)}
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 600, color: colors.textMuted }}>
                Minutos dentro antes de la alerta
              </span>
              <input
                type="number"
                min={MIN_MINUTES}
                max={MAX_MINUTES}
                value={minutes}
                onChange={(event) => setMinutes(event.target.value)}
                style={{
                  width: 84,
                  border: `1px solid ${colors.border}`,
                  background: colors.bgInput,
                  borderRadius: 10,
                  padding: '8px 10px',
                  font: 'inherit',
                  fontSize: 15,
                  fontWeight: 700,
                  color: colors.textPrimary,
                  outline: 'none',
                  textAlign: 'center',
                }}
                className="ui-input"
              />
            </div>
            <input
              type="range"
              min={MIN_MINUTES}
              max={240}
              value={Number.isFinite(parsed) ? Math.min(parsed, 240) : MIN_MINUTES}
              onChange={(event) => setMinutes(event.target.value)}
              style={{ width: '100%', accentColor: colors.accent }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: colors.accentBgSofter,
              border: `1px dashed ${colors.borderDashed}`,
              borderRadius: 12,
              padding: '11px 14px',
              fontSize: 12.5,
              color: colors.textMuted,
            }}
          >
            {valid ? (
              <span>
                Ejemplo: un vehículo que entra a las <b style={{ color: colors.textPrimary }}>14:00</b>{' '}
                se marca &quot;Atención&quot; a las{' '}
                <b style={{ color: colors.textPrimary }}>
                  {new Date(new Date(2000, 0, 1, 14, 0).getTime() + parsed * 60_000).toLocaleTimeString(
                    'es',
                    { hour: '2-digit', minute: '2-digit' },
                  )}
                </b>{' '}
                ({formatDuration(parsed * 60_000)} después).
              </span>
            ) : (
              <span>Ingresá un número entero entre {MIN_MINUTES} y {MAX_MINUTES} minutos.</span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button
              ref={saveBtnRef}
              type="button"
              onClick={handleSave}
              disabled={saving || !valid}
              className="ui-btn ui-cta"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                border: 'none',
                background: !valid ? colors.accentDisabledBg : justSaved ? colors.green : colors.accent,
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
              {justSaved && <Check size={16} strokeWidth={2.5} />}
              {saving ? 'Guardando…' : justSaved ? 'Guardado' : 'Guardar'}
            </button>
            {error && <div style={{ color: colors.error, fontSize: 12.5 }}>{error}</div>}
          </div>
          </div>
        </div>
      )}
    </div>
  );
}
