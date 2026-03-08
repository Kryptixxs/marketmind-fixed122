'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { DenseTable, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { FIELD_CATALOG } from '../../services/fieldCatalog';
import { makeField, makeFunction } from '../entities/types';
import { computeFieldMeta } from '../../services/fieldRuntime';
import { useTerminalOS } from '../TerminalOSContext';

const COLS: DenseColumn[] = [
  { key: 'step', header: 'Step', width: '50px', align: 'right' },
  { key: 'node', header: 'Node', width: '1fr' },
  { key: 'freshness', header: 'Fresh', width: '70px' },
  { key: 'provenance', header: 'Prov', width: '70px' },
];

function lineageRows(fieldId: string) {
  const def = FIELD_CATALOG[fieldId];
  const meta = computeFieldMeta(fieldId, { source: def?.provenance ?? 'SIM' });
  const prov = meta.source;
  const freq = (def?.cadence ?? def?.updateFreq ?? 'daily').toUpperCase();
  return [
    { id: '1', step: 1, node: `SOURCE: feed.${fieldId}`, freshness: meta.freshness, provenance: prov, entity: makeField(fieldId, undefined, undefined, meta) },
    { id: '2', step: 2, node: `TRANSFORM: ${meta.transforms[0]}`, freshness: 'FRESH', provenance: 'CALC', entity: makeFunction('MAP', 'Field Mapping') },
    { id: '3', step: 3, node: `TRANSFORM: ${meta.transforms[1]}`, freshness: 'FRESH', provenance: 'CALC', entity: makeFunction('QLT', 'Data Quality') },
    { id: '4', step: 4, node: `DISPLAY: panel.render.${fieldId} @ ${meta.asOf.slice(11, 19)}Z`, freshness: meta.freshness, provenance: meta.stale ? 'STALE' : prov, entity: makeFunction('FLD', 'Field Catalog') },
  ];
}

export function FnLINE({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const suggested = panels[panelIdx]?.activeSecurity?.toUpperCase() ?? 'PX_LAST';
  const [fieldId, setFieldId] = useState(FIELD_CATALOG[suggested] ? suggested : 'PX_LAST');
  useEffect(() => {
    if (!FIELD_CATALOG[suggested]) return;
    setFieldId(suggested);
  }, [suggested]);
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
