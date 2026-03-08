'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { FIELD_CATALOG } from '../../services/fieldCatalog';
import { makeField } from '../entities/types';
import { appendAuditEvent } from '../commandAuditStore';
import { DENSITY } from '../../constants/layoutDensity';

const COLS: DenseColumn[] = [
  { key: 'id', header: 'Field', width: '100px' },
  { key: 'label', header: 'Definition', width: '1fr' },
  { key: 'unit', header: 'Unit', width: '70px' },
  { key: 'freq', header: 'Freq', width: '80px' },
  { key: 'chart', header: 'Chart', width: '60px' },
  { key: 'prov', header: 'Prov', width: '70px' },
];

function usageHints(fieldId: string): string {
  if (fieldId.includes('PX') || fieldId === 'VWAP') return 'HP, GP, STAT';
  if (fieldId.includes('YIELD') || fieldId.includes('SPREAD')) return 'GC, CACH';
  if (fieldId.includes('VOL') || fieldId === 'BETA') return 'LAT, QLT';
  return 'DES, FLD';
}

export function FnFLD({ panelIdx = 0 }: { panelIdx?: number }) {
  const [query, setQuery] = useState('');
  const rows = useMemo(() => {
    const q = query.trim().toUpperCase();
    return Object.values(FIELD_CATALOG)
      .filter((f) => !q || `${f.id} ${f.label} ${f.description}`.toUpperCase().includes(q))
      .map((f) => ({
        id: f.id,
        label: `${f.label} — ${f.description}`,
        unit: f.unit || '—',
        freq: f.updateFreq.toUpperCase(),
        chart: f.chartable ? 'YES' : 'NO',
        prov: f.provenance,
        usage: usageHints(f.id),
      }));
  }, [query]);

  const usageCols: DenseColumn[] = [...COLS, { key: 'usage', header: 'Used In', width: '150px' }];

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="FLD • Field Catalog (Full)" right={<StatusBadge label="SIM/LIVE/STALE" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search field: beta, vwap, pe..."
          className="flex-1 bg-transparent outline-none" />
        <button type="button" onClick={() => appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: 'FLD apply field to screener (sim)' })}>Apply→SCRN</button>
        <button type="button" onClick={() => appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: 'FLD add field to monitor (sim)' })}>Add→MON</button>
      </div>
      {rows.length > 0 ? (
        <DenseTable
          columns={usageCols}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          rowEntity={(r) => makeField(String(r.id), 0)}
        />
      ) : (
        <EmptyFill hint="NO FIELDS MATCH QUERY" />
      )}
    </div>
  );
}
