'use client';

import { ChevronDown, Pencil, Search, Star } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { getFieldDefinitionsAction } from '@/actions/field-definitions.actions';
import {
  getFrequentAction,
  getHistoryAction,
  getInsideAction,
} from '@/actions/parking-records.actions';
import { formatDate, formatDuration, formatTime, tipoLabel } from '@/lib/format';
import { useStaggerReveal } from '@/lib/use-stagger-reveal';
import { colors, fonts } from '@/styles/theme';
import type { FieldDefinition, FrequentPlate, ParkingRecord } from '@/types';
import { EditRecordModal, type EditableRecord } from './EditRecordModal';
import { VehicleIcon } from './record-display-utils';

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

interface FrecuentesTabProps {
  onToast: (message: string) => void;
}

export function FrecuentesTab({ onToast }: FrecuentesTabProps) {
  const [plates, setPlates] = useState<FrequentPlate[]>([]);
  const [customFields, setCustomFields] = useState<FieldDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [editingRecord, setEditingRecord] = useState<EditableRecord | null>(null);
  const [expandedPlaca, setExpandedPlaca] = useState<string | null>(null);
  const [movements, setMovements] = useState<Record<string, ParkingRecord[]>>({});
  const [movementsLoading, setMovementsLoading] = useState<string | null>(null);

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

  const handleEditSaved = () => {
    setEditingRecord(null);
    onToast('Registro actualizado');
    getFrequentAction()
      .then(setPlates)
      .catch(() => undefined);
    // The edited record may also be sitting in an already-loaded movements
    // list — drop its cache so the next expand refetches the corrected data.
    setMovements({});
  };

  const toggleExpanded = (placa: string) => {
    const next = expandedPlaca === placa ? null : placa;
    setExpandedPlaca(next);
    if (next && !movements[next]) {
      setMovementsLoading(next);
      // "Movimientos" needs both closed visits (/history) and any visit
      // still open (/inside) — /history alone would silently drop a plate's
      // current, still-ongoing entrada. Both endpoints do a partial ILIKE
      // match on placa, so filter down to an exact match client-side.
      Promise.all([getHistoryAction({ placa: next }), getInsideAction(next)])
        .then(([closed, open]) => {
          const exact = [...closed, ...open]
            .filter((record) => record.placa === next)
            .sort((a, b) => new Date(b.entradaTime).getTime() - new Date(a.entradaTime).getTime());
          setMovements((current) => ({ ...current, [next]: exact }));
        })
        .catch(() => undefined)
        .finally(() => setMovementsLoading((current) => (current === next ? null : current)));
    }
  };

  const matches = useMemo(
    () => plates.filter((plate) => !query || plate.placa.toLowerCase().includes(query.toLowerCase())),
    [plates, query],
  );
  const listRef = useStaggerReveal<HTMLDivElement>(
    '.frecuente-card',
    matches.map((p) => p.placa).join(','),
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
              fontSize: 16,
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

      <div ref={listRef} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {matches.map((plate) => {
          const extraEntries = getExtraEntries(plate, customFields);
          const isExpanded = expandedPlaca === plate.placa;
          const plateMovements = movements[plate.placa];
          return (
            <div
              key={plate.placa}
              className="frecuente-card"
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
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
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
                    }}
                  >
                    <Star size={11} strokeWidth={2.2} fill="currentColor" />
                    {plate.visitCount} visitas
                  </span>
                  <button
                    onClick={() =>
                      setEditingRecord({
                        id: plate.id,
                        placa: plate.placa,
                        tipo: plate.tipo,
                        extraFields: plate.extraFields,
                      })
                    }
                    className="ui-btn"
                    aria-label="Editar patente"
                    title="Editar"
                    style={{
                      width: 26,
                      height: 26,
                      border: 'none',
                      background: 'transparent',
                      color: colors.textDim,
                      cursor: 'pointer',
                      borderRadius: 7,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Pencil size={13} strokeWidth={2} />
                  </button>
                </div>
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

              <button
                onClick={() => toggleExpanded(plate.placa)}
                className="ui-btn"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                  border: 'none',
                  borderTop: `1px dashed ${colors.border}`,
                  background: 'transparent',
                  color: colors.textMuted,
                  cursor: 'pointer',
                  padding: '8px 0 0',
                  marginTop: 2,
                  font: 'inherit',
                  fontWeight: 600,
                  fontSize: 11.5,
                }}
              >
                <ChevronDown
                  size={13}
                  strokeWidth={2}
                  style={{
                    transform: isExpanded ? 'rotate(180deg)' : 'none',
                    transition: 'transform .18s ease',
                  }}
                />
                {isExpanded ? 'Ocultar movimientos' : 'Ver movimientos'}
              </button>

              {isExpanded && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7, animation: 'fadeUp .2s both' }}>
                  {movementsLoading === plate.placa && (
                    <div style={{ fontSize: 12, color: colors.textDim, padding: '4px 0' }}>Cargando…</div>
                  )}
                  {movementsLoading !== plate.placa && plateMovements?.length === 0 && (
                    <div style={{ fontSize: 12, color: colors.textDim, padding: '4px 0' }}>
                      Sin movimientos registrados.
                    </div>
                  )}
                  {movementsLoading !== plate.placa &&
                    plateMovements?.map((movement) => (
                      <div
                        key={movement.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                          background: colors.bgInputAlt,
                          borderRadius: 10,
                          padding: '8px 11px',
                          fontSize: 11.5,
                        }}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span style={{ color: colors.textPrimary, fontWeight: 600 }}>
                            {formatDate(movement.entradaTime)}
                          </span>
                          <span style={{ fontFamily: fonts.mono, color: colors.textMuted }}>
                            {formatTime(movement.entradaTime)}
                            {movement.salidaTime ? ` – ${formatTime(movement.salidaTime)}` : ' – dentro'}
                          </span>
                        </div>
                        <span style={{ color: colors.accent, fontWeight: 700, flexShrink: 0 }}>
                          {movement.salidaTime
                            ? formatDuration(
                                new Date(movement.salidaTime).getTime() -
                                  new Date(movement.entradaTime).getTime(),
                              )
                            : '—'}
                        </span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {editingRecord && (
        <EditRecordModal
          record={editingRecord}
          onSaved={handleEditSaved}
          onCancel={() => setEditingRecord(null)}
        />
      )}
    </div>
  );
}
