'use client';

import { ExecCenterStack } from '../ExecCenterStack';

type ModuleVariant = 'DES' | 'FA' | 'HP' | 'WEI' | 'YAS' | 'OVME' | 'PORT' | 'INTEL' | 'NEWS' | 'CAL' | 'SEC' | 'MKT';

export function StandardIntelligenceModule({ code, title }: { code: ModuleVariant; title: string }) {
  return (
    <section className="flex-1 w-full min-w-0 min-h-0 flex flex-col border border-[#111] bg-black font-mono tracking-tight uppercase tabular-nums">
      <ExecCenterStack execMode="ESC" titleOverride={`${title} CENTER STACK [EXEC DENSITY]`} />
      <div className="h-[12px] px-[2px] border-t border-[#111] bg-[#090909] text-[7px] text-[#7a7a7a] flex items-center justify-between">
        <span>{code} MIRRORS EXEC STACK LOGIC</span>
        <span>SIMULATED / PROVISIONAL / DEMO DATA</span>
      </div>
    </section>
  );
}
