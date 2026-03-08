'use client';

import { useEffect } from 'react';
import { usePanelFocus } from '../context/PanelFocusContext';

/**
 * Global keyboard: Alt+1-4 focus panel, Ctrl+Tab rotate between panels.
 */
export function usePanelKeyboardShortcuts() {
  const { activePanelIndex, setActivePanel } = usePanelFocus();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.altKey && !e.ctrlKey && !e.metaKey) {
        const n = parseInt(e.key, 10);
        if (n >= 1 && n <= 4) {
          e.preventDefault();
          setActivePanel(n - 1);
          return;
        }
      }
      if (e.ctrlKey && e.key === 'Tab') {
        e.preventDefault();
        const next = activePanelIndex === null ? 0 : (activePanelIndex + 1) % 4;
        setActivePanel(next);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activePanelIndex, setActivePanel]);
}
