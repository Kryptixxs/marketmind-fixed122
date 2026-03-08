'use client';

import { TerminalBandDefinition } from '../../types';
import { PanelSlot } from './PanelSlot';

export function BandFrame({ band }: { band: TerminalBandDefinition }) {
  return (
    <section className="min-h-0 flex flex-col gap-px bg-black">
      {band.panels.map((panel) => (
        <PanelSlot key={panel.id} panel={panel} />
      ))}
    </section>
  );
}
