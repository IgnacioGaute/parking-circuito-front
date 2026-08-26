'use client';

import { Bike, Car, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getFieldDefinitionsAction } from '@/actions/field-definitions.actions';
import { getFrequentAction } from '@/actions/parking-records.actions';
import { formatDate, formatTime, tipoLabel } from '@/lib/format';
import { colors, fonts } from '@/styles/theme';
import type { FieldDefinition, FrequentPlate } from '@/types';

function VehicleIcon({ tipo, size = 18 }: { tipo: 'auto' | 'moto'; size?: number }) {
  return tipo === 'auto' ? <Car size={size} strokeWidth={2} /> : <Bike size={size} strokeWidth={2} />;
}

function formatExtraValue(value: unknown, field?: FieldDefinition): string {
  if (value === undefined || value === null || value === '') return '—';
  if (field?.type === 'boolean') return value === true ? 'Sí' : 'No';
  return String(value);
}

function getExtraEntries(plate: FrequentPlate, customFields: FieldDefinition[]) {
  const extraFields = plate.extraFields ?? {};
  return customFields
    .map((field) => ({ field, value: extraFields[field.key] }))
    .filter(({ value }) => value !== undefined && value !== null && value !== '');
}

export function FrecuentesTab() {
  const [plates, setPlates] = useState<FrequentPlate[]>([]);
  const [customFields, setCustomFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    getFrequentAction()
      .then((result) => {
        if (!cancelled) setPlates(result);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    getFieldDefinitionsAction()
      .then((result) => {
        if (!cancelled) {
          setCustomFields(
            result.filter((f) => f.key !== 'placa' && f.key !== 'tipo' && f.key !== 'foto'),
          );
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const matches = useMemo(
    () => plates.filter((plate) => !query || plate.placa.toLowerCase().includes(query.toLowerCase())),
    [plates, query],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18, animation: 'fadeUp .3s both' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 18, fontWeight: 700 }}>Frecuentes</span>
        {plates.length > 0 && (
          <span style={{ fontFamily: fonts.mono, fontSize: 13, color: colors.textMuted }}>
            {plates.length} placa{plates.length === 1 ? '' : 's'}
          </span>
        )}
      </div>

      {plates.length > 0 && (
        <div style={{ position: 'relative' }}>
          <Search
            size={16}
            strokeWidth={2}
            style={{
              position: 'absolute',
              left: 13,
              top: '50%',
              transform: 'translateY(-50%)',
              color: colors.textDim,
              pointerEvents: 'none',
            }}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Buscar por placa"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              border: `1px solid ${colors.border}`,
              background: colors.bgInput,
              borderRadius: 12,
              padding: '12px 14px 12px 38px',
              font: 'inherit',
              fontSize: 14,
              outline: 'none',
              color: colors.textPrimary,
            }}
          />
        </div>
      )}

      {!loading && plates.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 16px',
            color: colors.textDim,
            fontSize: 14,
            border: `1px dashed ${colors.border}`,
            borderRadius: 12,
          }}
        >
          Todavía no hay patentes frecuentes.
          <br />
          Una patente se vuelve frecuente a partir de su segundo registro.
        </div>
      )}

      {!loading && plates.length > 0 && matches.length === 0 && (
        <div
          style={{
            textAlign: 'center',
            padding: '60px 16px',
            color: colors.textDim,
            fontSize: 14,
            border: `1px dashed ${colors.border}`,
            borderRadius: 12,
          }}
        >
          No se encontraron patentes frecuentes con esa placa.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {matches.map((plate) => {
          const extraEntries = getExtraEntries(plate, customFields);
          return (
            <div
              key={plate.placa}
              style={{
                background: colors.bgCard,
                border: `1px solid ${colors.border}`,
                borderRadius: 14,
                padding: '14px 16px',
                display: 'flex',
                flexDirection: 'column',
                gap: 9,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ display: 'flex', color: colors.textDim, flexShrink: 0 }}>
                    <VehicleIcon tipo={plate.tipo} size={15} />
                  </span>
                  <span
                    style={{
                      fontFamily: fonts.mono,
                      fontWeight: 700,
                      fontSize: 15,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {plate.placa}
                  </span>
                  <span style={{ fontSize: 12, color: colors.textDim }}>{tipoLabel(plate.tipo)}</span>
                </div>
                <span
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 10.5,
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 999,
                    background: colors.accentBgSoft,
                    color: colors.accentText,
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                  }}
                >
                  <Star size={11} strokeWidth={2.2} fill="currentColor" />
                  {plate.visitCount} visitas
                </span>
              </div>

              <div style={{ fontSize: 11.5, color: colors.textMuted }}>
                Última vez: {formatDate(plate.lastEntradaTime)} · {formatTime(plate.lastEntradaTime)}
              </div>

              {extraEntries.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {extraEntries.map(({ field, value }) => (
                    <span
                      key={field.id}
                      style={{
                        fontSize: 10.5,
                        color: colors.textMuted,
                        background: colors.bgInputAlt,
                        borderRadius: 999,
                        padding: '3px 9px',
                      }}
                    >
                      {field.label}: {formatExtraValue(value, field)}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
