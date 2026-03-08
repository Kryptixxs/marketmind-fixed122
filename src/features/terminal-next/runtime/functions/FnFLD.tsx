'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { searchFieldDefs } from '../../services/fieldCatalog';
import { makeField, makeFunction } from '../entities/types';
import { appendAuditEvent } from '../commandAuditStore';
import { DENSITY } from '../../constants/layoutDensity';
import { addMonitorField } from '../monitorFieldStore';
import { useDrill } from '../entities/DrillContext';

const COLS: DenseColumn[] = [
  { key: 'id', header: 'Field', width: '98px', entity: (r) => makeField(String(r.id)) },
  { key: 'label', header: 'Label/Definition', width: '1.5fr' },
  { key: 'unit', header: 'Unit', width: '64px' },
  { key: 'type', header: 'Type', width: '58px' },
  { key: 'cadence', header: 'Cadence', width: '76px' },
  { key: 'chart', header: 'Chart', width: '52px' },
  { key: 'assets', header: 'Assets', width: '120px' },
  { key: 'prov', header: 'Prov', width: '56px' },
  { key: 'usage', header: 'Used In', width: '120px' },
];

function usageHints(fieldId: string): string {
  if (fieldId.includes('PX') || fieldId === 'VWAP') return 'HP, GP, STAT';
  if (fieldId.includes('YIELD') || fieldId.includes('SPREAD')) return 'GC, CACH';
  if (fieldId.includes('VOL') || fieldId === 'BETA') return 'LAT, QLT';
  return 'DES, FLD';
}

export function FnFLD({ panelIdx = 0 }: { panelIdx?: number }) {
  const { drill } = useDrill();
  const [query, setQuery] = useState('');
  const [selectedIdx, setSelectedIdx] = useState(0);
  const rows = useMemo(() => {
    return searchFieldDefs(query)
      .map((f) => ({
        id: f.id,
        label: `${f.label} — ${f.definition}`,
        unit: f.unit || '—',
        type: f.valueType.toUpperCase(),
        cadence: f.cadence.toUpperCase(),
        chart: f.chartable ? 'YES' : 'NO',
        assets: f.availability.join(','),
        prov: f.provenance,
        usage: usageHints(f.id),
      }));
  }, [query]);
  const selected = rows[selectedIdx] ?? rows[0];

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="FLD • Field Finder + Catalog" right={<StatusBadge label="SIM/LIVE/STALE" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: DENSITY.commandBarHeightPx, borderBottom: `1px solid ${DENSITY.gridlineColor}` }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search field id, label, definition, asset..."
          className="flex-1 bg-transparent outline-none" />
        <button type="button" onClick={() => {
          if (!selected) return;
          addMonitorField(String(selected.id));
          appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: `FLD add ${selected.id} to monitor columns` });
        }}>Add→MON</button>
        <button type="button" onClick={() => {
          if (!selected) return;
          appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: `FLD add ${selected.id} to screener` });
        }}>Add→SCRN</button>
        <button type="button" onClick={() => {
          if (!selected) return;
          appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: `FLD chart ${selected.id}` });
          drill(makeField(String(selected.id), 0), 'OPEN_IN_NEW_PANE', panelIdx);
        }}>Chart</button>
        <button type="button" onClick={() => {
          if (!selected) return;
          appendAuditEvent({ panelIdx, type: 'DRILL', actor: 'USER', detail: `FLD show where-used ${selected.id}` });
          drill(makeFunction('LINE', 'Lineage'), 'OPEN_IN_NEW_PANE', panelIdx);
        }}>Where Used</button>
      </div>
      {rows.length > 0 ? (
        <DenseTable
          columns={COLS}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          selectedRow={selectedIdx}
          onRowClick={(row) => setSelectedIdx(rows.findIndex((r) => r.id === row.id))}
          className="flex-1 min-h-0"
          rowEntity={(r) => makeField(String(r.id), 0)}
        />
      ) : (
        <EmptyFill hint="NO FIELDS MATCH QUERY" />
      )}
    </div>
  );
}
