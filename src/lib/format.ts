import { colors } from '@/styles/theme';

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('es', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es', {
    day: '2-digit',
    month: 'short',
  });
}

export function formatDuration(ms: number): string {
  const mins = Math.max(0, Math.round(ms / 60000));
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Local (not UTC) YYYY-MM-DD / HH:MM keys — sortable and directly comparable
// against <input type="date"/"time"> values, which are also local.
export function dateKey(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function timeKey(value: string | Date): string {
  const d = typeof value === 'string' ? new Date(value) : value;
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function formatDateHeading(key: string): string {
  const todayKey = dateKey(new Date());
  const yesterdayKey = dateKey(new Date(Date.now() - 86400000));
  if (key === todayKey) return 'Hoy';
  if (key === yesterdayKey) return 'Ayer';
  const [y, m, d] = key.split('-').map(Number);
  const label = new Date(y, m - 1, d).toLocaleDateString('es', {
    weekday: 'long',
    day: '2-digit',
    month: 'short',
  });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

export function tipoLabel(tipo: 'auto' | 'moto'): string {
  return tipo === 'auto' ? 'Auto' : 'Moto';
}

export function tipoColors(tipo: 'auto' | 'moto'): { bg: string; color: string } {
  return tipo === 'auto'
    ? { bg: colors.cyanAutoBgSoft, color: colors.cyanAuto }
    : { bg: colors.pinkMotoBgSoft, color: colors.pinkMoto };
}
