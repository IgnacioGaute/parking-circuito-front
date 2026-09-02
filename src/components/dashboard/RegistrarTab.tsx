'use client';

import { Car, CalendarCheck, Timer } from 'lucide-react';
import type { ComponentType } from 'react';
import { useEffect, useState } from 'react';
import { getHistoryAction, getInsideAction } from '@/actions/parking-records.actions';
import { dateKey, formatDuration } from '@/lib/format';
import { useStaggerReveal } from '@/lib/use-stagger-reveal';
import { colors, fonts } from '@/styles/theme';
import type { ParkingRecord } from '@/types';
import { EntradaForm } from './EntradaForm';

interface RegistrarTabProps {
  onEntradaRegistered: () => void;
}

function averageStay(records: ParkingRecord[]): string {
  if (records.length === 0) return '—';
  const now = Date.now();
  const totalMs = records.reduce(
    (acc, record) => acc + (now - new Date(record.entradaTime).getTime()),
    0,
  );
  return formatDuration(totalMs / records.length);
}

export function RegistrarTab({ onEntradaRegistered }: RegistrarTabProps) {
  const [insideRecords, setInsideRecords] = useState<ParkingRecord[]>([]);
  const [todayCount, setTodayCount] = useState(0);

  const refresh = () => {
    getInsideAction()
      .then(setInsideRecords)
      .catch(() => undefined);
    const todayKey = dateKey(new Date());
    getHistoryAction({})
      .then((records) => {
        setTodayCount(records.filter((record) => dateKey(record.entradaTime) === todayKey).length);
      })
      .catch(() => undefined);
  };

  useEffect(refresh, []);

  const handleRegistered = () => {
    refresh();
    onEntradaRegistered();
  };

  const stats: Array<{ label: string; value: string; accent: boolean; Icon: ComponentType<{ size?: number; strokeWidth?: number }> }> = [
    { label: 'Dentro', value: String(insideRecords.length), accent: true, Icon: Car },
    { label: 'Hoy', value: String(todayCount), accent: false, Icon: CalendarCheck },
    { label: 'Promedio', value: averageStay(insideRecords), accent: false, Icon: Timer },
  ];
  const statsRef = useStaggerReveal<HTMLDivElement>(
    '.registrar-stat',
    `${insideRecords.length}|${todayCount}`,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, animation: 'fadeUp .3s both' }}>
      <div ref={statsRef} style={{ display: 'flex', gap: 9 }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="registrar-stat"
            style={{
              flex: 1,
              position: 'relative',
              overflow: 'hidden',
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: 15,
              padding: '13px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            {stat.accent && (
              <div
                aria-hidden
                style={{
                  position: 'absolute',
                  top: -18,
                  right: -18,
                  width: 60,
                  height: 60,
                  borderRadius: '50%',
                  background: colors.accentBgSofter,
                  pointerEvents: 'none',
                }}
              />
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative' }}>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: colors.textDim,
                }}
              >
                {stat.label}
              </span>
              <span
                style={{
                  width: 24,
                  height: 24,
                  borderRadius: 7,
                  background: stat.accent ? colors.accentBgSoft : colors.bgInputAlt,
                  color: stat.accent ? colors.accent : colors.textMuted,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <stat.Icon size={12} strokeWidth={2.4} />
              </span>
            </div>
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1,
                color: stat.accent ? colors.accent : colors.textPrimary,
                position: 'relative',
              }}
            >
              {stat.value}
            </div>
          </div>
        ))}
      </div>
      <EntradaForm onRegistered={handleRegistered} />
    </div>
  );
}
