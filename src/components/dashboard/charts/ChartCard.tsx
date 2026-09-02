'use client';

import { Table2, TrendingUp } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { colors, fonts } from '@/styles/theme';

interface ChartCardProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  tableHeaders?: string[];
  tableRows?: (string | number)[][];
}

// Card chrome shared by every chart, plus the plain-table view dataviz
// requires as the non-visual fallback for every value a chart shows.
export function ChartCard({ title, subtitle, children, tableHeaders, tableRows }: ChartCardProps) {
  const [showTable, setShowTable] = useState(false);
  const hasTable = !!tableHeaders && !!tableRows && tableRows.length > 0;

  return (
    <div
      style={{
        background: colors.bgCard,
        border: `1px solid ${colors.border}`,
        borderRadius: 16,
        padding: '18px 20px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
        minWidth: 0,
      }}
      className="stats-chart-card"
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontSize: 14.5, fontWeight: 700, color: colors.textPrimary }}>{title}</div>
          {subtitle && <div style={{ fontSize: 11.5, color: colors.textMuted, marginTop: 2 }}>{subtitle}</div>}
        </div>
        {hasTable && (
          <button
            onClick={() => setShowTable((v) => !v)}
            className="ui-btn"
            aria-label={showTable ? 'Ver gráfico' : 'Ver datos en tabla'}
            title={showTable ? 'Ver gráfico' : 'Ver datos en tabla'}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              border: `1px solid ${colors.border}`,
              background: 'transparent',
              color: colors.textMuted,
              cursor: 'pointer',
              padding: '5px 9px',
              borderRadius: 8,
              fontSize: 10.5,
              fontWeight: 700,
              flexShrink: 0,
              font: 'inherit',
            }}
          >
            {showTable ? <TrendingUp size={12} strokeWidth={2} /> : <Table2 size={12} strokeWidth={2} />}
            {showTable ? 'Gráfico' : 'Tabla'}
          </button>
        )}
      </div>

      {showTable && hasTable ? (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                {tableHeaders!.map((h) => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '6px 8px',
                      color: colors.textMuted,
                      fontWeight: 700,
                      borderBottom: `1px solid ${colors.border}`,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows!.map((row, i) => (
                <tr key={i}>
                  {row.map((cell, j) => (
                    <td
                      key={j}
                      style={{
                        padding: '6px 8px',
                        borderBottom: `1px solid ${colors.border}`,
                        color: colors.textPrimary,
                        fontFamily: j > 0 ? fonts.mono : undefined,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        children
      )}
    </div>
  );
}
