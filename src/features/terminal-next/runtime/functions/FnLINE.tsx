'use client';

import React, { useMemo, useState } from 'react';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { FIELD_CATALOG } from '../../services/fieldCatalog';
import { makeField, makeFunction } from '../entities/types';

const COLS: DenseColumn[] = [
  { key: 'step', header: 'Step', width: '50px', align: 'right' },
  { key: 'node', header: 'Node', width: '1fr' },
  { key: 'freshness', header: 'Fresh', width: '70px' },
  { key: 'provenance', header: 'Prov', width: '70px' },
];

function lineageRows(fieldId: string) {
  const def = FIELD_CATALOG[fieldId];
  const prov = def?.provenance ?? 'SIM';
  const freq = (def?.updateFreq ?? 'daily').toUpperCase();
  return [
    { id: '1', step: 1, node: `SOURCE: feed.${fieldId}`, freshness: freq, provenance: prov, entity: makeField(fieldId) },
    { id: '2', step: 2, node: `TRANSFORM: normalize_${fieldId.toLowerCase()}`, freshness: 'TICK', provenance: 'CALC', entity: makeFunction('MAP', 'Field Mapping') },
    { id: '3', step: 3, node: `COMPUTE: quality_guard(${fieldId})`, freshness: 'TICK', provenance: 'CALC', entity: makeFunction('QLT', 'Data Quality') },
    { id: '4', step: 4, node: `DISPLAY: panel.render.${fieldId}`, freshness: 'LIVE', provenance: prov, entity: makeFunction('FLD', 'Field Catalog') },
  ];
}

export function FnLINE({ panelIdx = 0 }: { panelIdx?: number }) {
  const [fieldId, setFieldId] = useState('PX_LAST');
  const rows = useMemo(() => lineageRows(fieldId), [fieldId]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="LINE • Data Lineage Viewer" right={<StatusBadge label="TRACE" variant="sim" />} />
      <div className="flex items-center gap-2 px-1" style={{ height: 18, borderBottom: '1px solid #111' }}>
        <span style={{ color: '#93a9c6', fontSize: 9 }}>Field</span>
        <input value={fieldId} onChange={(e) => setFieldId(e.target.value.toUpperCase())} className="flex-1 bg-transparent outline-none" />
      </div>
      <DenseTable
        columns={COLS}
        rows={rows}
        rowKey="id"
        panelIdx={panelIdx}
        className="flex-1 min-h-0"
        rowEntity={(r) => (r.entity as ReturnType<typeof makeField>)}
      />
    </div>
  );
}
