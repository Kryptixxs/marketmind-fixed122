'use client';

import React, { useMemo } from 'react';
import { DenseTable, EmptyFill, PanelSubHeader, StatusBadge, type DenseColumn } from '../primitives';
import { useTerminalOS } from '../TerminalOSContext';
import { MNEMONIC_DEFS } from '../MnemonicRegistry';
import { listAuditEvents } from '../commandAuditStore';
import { makeFunction } from '../entities/types';

const COLS: DenseColumn[] = [
  { key: 'rank', header: '#', width: '40px', align: 'right' },
  { key: 'code', header: 'Action', width: '80px' },
  { key: 'why', header: 'Why', width: '1fr' },
  { key: 'provenance', header: 'Prov', width: '70px' },
];

export function FnNX({ panelIdx = 0 }: { panelIdx?: number }) {
  const { panels } = useTerminalOS();
  const p = panels[panelIdx]!;

  const rows = useMemo(() => {
    const related = (MNEMONIC_DEFS[p.activeMnemonic]?.relatedCodes ?? []).slice(0, 6);
    const audit = listAuditEvents(80);
    const recents = audit
      .filter((e) => e.panelIdx === panelIdx && e.mnemonic && e.mnemonic !== p.activeMnemonic)
      .map((e) => e.mnemonic as string)
      .slice(0, 6);
    const policyHints = audit.some((e) => e.type === 'POLICY_BLOCK') ? ['POL', 'COMP', 'ENT', 'AUD'] : ['AUD', 'NAV'];
    const merged = [...new Set([...related, ...recents, ...policyHints])].filter((code) => code && code !== p.activeMnemonic).slice(0, 10);
    return merged.map((code, idx) => ({
      id: `${code}-${idx}`,
      rank: idx + 1,
      code,
      why: idx < related.length
        ? `Related to ${p.activeMnemonic}`
        : recents.includes(code)
          ? 'Frequently visited recently'
          : 'Governance follow-up',
      provenance: 'SIM',
    }));
  }, [p.activeMnemonic, panelIdx]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <PanelSubHeader title="NX • Next Best Actions Engine" right={<StatusBadge label={`${rows.length} ACTIONS`} variant="sim" />} />
      {rows.length > 0 ? (
        <DenseTable
          columns={COLS}
          rows={rows}
          rowKey="id"
          panelIdx={panelIdx}
          className="flex-1 min-h-0"
          rowEntity={(r) => makeFunction(String(r.code), MNEMONIC_DEFS[String(r.code)]?.title)}
          keyboardNav
        />
      ) : (
        <EmptyFill hint="NO ACTION HINTS — BUILD CONTEXT VIA GO/DRILL FIRST" />
      )}
    </div>
  );
}
