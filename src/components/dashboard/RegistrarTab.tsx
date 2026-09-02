'use client';

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

  const stats: Array<{ label: string; value: string; accent: boolean }> = [
    { label: 'Dentro', value: String(insideRecords.length), accent: true },
    { label: 'Hoy', value: String(todayCount), accent: false },
    { label: 'Promedio', value: averageStay(insideRecords), accent: false },
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
              background: colors.bgCard,
              border: `1px solid ${colors.border}`,
              borderRadius: 14,
              padding: '12px 13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <div
              style={{
                fontFamily: fonts.mono,
                fontSize: 22,
                fontWeight: 700,
                lineHeight: 1,
                color: stat.accent ? colors.accent : colors.textPrimary,
              }}
            >
              {stat.value}
            </div>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                letterSpacing: '0.05em',
                textTransform: 'uppercase',
                color: colors.textDim,
              }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      <EntradaForm onRegistered={handleRegistered} />
    </div>
  );
}
