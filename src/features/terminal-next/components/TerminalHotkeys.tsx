'use client';

import { useEffect } from 'react';
import { useTerminalLayout } from '../context/TerminalLayoutContext';

export function TerminalHotkeys() {
  const { zoomedQuadrant, setZoomedQuadrant, toggleCrtOverlay } = useTerminalLayout();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+1–4: Zoom quadrant (maximize panel)
      if (e.altKey && !e.metaKey && !e.ctrlKey && !e.shiftKey) {
        const n = e.key === '1' ? 1 : e.key === '2' ? 2 : e.key === '3' ? 3 : e.key === '4' ? 4 : 0;
        if (n >= 1 && n <= 4) {
          e.preventDefault();
          setZoomedQuadrant(zoomedQuadrant === n - 1 ? null : (n - 1) as 0 | 1 | 2 | 3);
          return;
        }
      }

      // Alt+0 or Escape: Reset zoom
      if ((e.altKey && e.key === '0') || e.key === 'Escape') {
        setZoomedQuadrant(null);
      }

      // Alt+S: Toggle CRT/scanline overlay
      if (e.altKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        toggleCrtOverlay();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedQuadrant, setZoomedQuadrant, toggleCrtOverlay]);

  return null;
}
