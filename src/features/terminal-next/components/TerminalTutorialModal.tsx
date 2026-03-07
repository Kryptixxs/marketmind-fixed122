'use client';

import { useTerminalStore } from '../store/TerminalStore';

type TutorialSection = 'WORKFLOW' | 'PANELS' | 'SHORTCUTS' | 'PRACTICE';

export function TerminalTutorialModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { dispatch } = useTerminalStore();
  const sections: TutorialSection[] = ['WORKFLOW', 'PANELS', 'SHORTCUTS', 'PRACTICE'];
  const run = (cmd: string) => {
    dispatch({ type: 'SET_COMMAND', payload: cmd });
    dispatch({ type: 'EXECUTE_COMMAND', payload: cmd });
  };
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[120] bg-black/70 flex items-center justify-center px-3">
      <div className="w-full max-w-5xl h-[78vh] border border-[#2b3f5f] bg-[#050b14] grid grid-rows-[28px_1fr_28px]">
        <div className="px-2 border-b border-[#2b3f5f] bg-[#08111d] flex items-center justify-between text-[10px]">
          <span className="text-[#f4cf76] font-bold">TERMINAL OPERATOR TUTORIAL</span>
          <button onClick={onClose} className="h-5 px-1 border border-[#5a1f35] bg-[#2b1019] text-[#ffd5e1] text-[9px] font-bold">CLOSE</button>
        </div>
        <div className="grid grid-cols-[180px_1fr] gap-px bg-[#1a2433] min-h-0">
          <div className="bg-[#07101c] min-h-0 overflow-y-auto custom-scrollbar">
            {sections.map((s) => (
              <div key={s} className="px-2 py-[4px] border-b border-[#142034] text-[9px] text-[#9eb3cf]">
                <span className="text-[#63c8ff] mr-1">#{sections.indexOf(s) + 1}</span>{s}
              </div>
            ))}
          </div>
          <div className="bg-[#07101c] min-h-0 overflow-y-auto custom-scrollbar text-[9px]">
            <div className="grid grid-cols-2 gap-px bg-[#142034]">
              <div className="bg-[#09111c] px-2 py-1">
                <div className="text-[#f4cf76] font-bold mb-1">WORKFLOW</div>
                <div className="text-[#cdd9ea]">1) Select symbol from monitors/tickers</div>
                <div className="text-[#cdd9ea]">2) Enter `&lt;TICKER&gt; &lt;FUNCTION&gt; GO`</div>
                <div className="text-[#cdd9ea]">3) Use DEPTH/TAPE/ALERTS top keys</div>
                <div className="text-[#cdd9ea]">4) Drill from EXEC to DES/FA/HP modules</div>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <button onClick={() => run('AAPL US EXEC GO')} className="px-1 py-[2px] border border-[#274b66] text-[#d4efff] bg-[#101b2c]">AAPL EXEC</button>
                  <button onClick={() => run('MSFT US DES GO')} className="px-1 py-[2px] border border-[#274b66] text-[#d4efff] bg-[#101b2c]">MSFT DES</button>
                </div>
              </div>
              <div className="bg-[#09111c] px-2 py-1">
                <div className="text-[#f4cf76] font-bold mb-1">PANEL READING ORDER</div>
                <div className="text-[#cdd9ea]">Priority 1: Last / Abs / % Chg / Volume</div>
                <div className="text-[#cdd9ea]">Priority 2: Depth ladder + Time &amp; Sales</div>
                <div className="text-[#cdd9ea]">Priority 3: Risk stack + Correlations</div>
                <div className="text-[#cdd9ea]">Priority 4: News/System/Alerts</div>
                <div className="mt-2 text-[#9eb3cf]">Use FACTORS for risk diagnostics, EVENTS for flow and logs.</div>
              </div>
              <div className="bg-[#09111c] px-2 py-1">
                <div className="text-[#f4cf76] font-bold mb-1">TOP BUTTON MAP</div>
                <div className="text-[#cdd9ea]">DEPTH: Order book dominant rail</div>
                <div className="text-[#cdd9ea]">TAPE: Print stream dominant rail</div>
                <div className="text-[#cdd9ea]">ALERTS: Alert console + reject/feed audit</div>
                <div className="text-[#cdd9ea]">RISK: Factors analytics stack</div>
                <div className="text-[#cdd9ea]">NEWS/SYSTEM: Feed source switch</div>
              </div>
              <div className="bg-[#09111c] px-2 py-1">
                <div className="text-[#f4cf76] font-bold mb-1">SHORTCUTS</div>
                <div className="text-[#cdd9ea]">Ctrl/Cmd + L: focus command input</div>
                <div className="text-[#cdd9ea]">Enter: execute current command</div>
                <div className="text-[#cdd9ea]">Escape: clear command input</div>
                <div className="mt-2 grid grid-cols-2 gap-1">
                  <button onClick={() => run('EURUSD Curncy HP GO')} className="px-1 py-[2px] border border-[#174432] text-[#dbffe7] bg-[#0e2117]">EURUSD HP</button>
                  <button onClick={() => run('NVDA US FA GO')} className="px-1 py-[2px] border border-[#174432] text-[#dbffe7] bg-[#0e2117]">NVDA FA</button>
                </div>
              </div>
            </div>
            <div className="px-2 py-1 border-t border-[#142034] text-[#9eb3cf]">
              Practical rule: if a button is visible, it should recompose data context immediately. Use function keys for module swaps and operator keys for rail/feed/analytics focus.
            </div>
          </div>
        </div>
        <div className="px-2 border-t border-[#2b3f5f] bg-[#08111d] flex items-center justify-between text-[9px]">
          <span className="text-[#9eb3cf]">TUTORIAL READY • SIMULATED MARKET MODE</span>
          <button onClick={() => run('AAPL US EXEC GO')} className="h-5 px-2 border border-[#2fd370] bg-[#0d5e2a] text-[#dbffe7] text-[9px] font-bold">START EXEC FLOW</button>
        </div>
      </div>
    </div>
  );
}
