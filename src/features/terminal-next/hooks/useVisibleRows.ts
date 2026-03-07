/**
 * Returns estimated row count from container height.
 * Uses ResizeObserver to measure container; rowHeight ~18–20px.
 * Fallback: if ref is null or not mounted, return high default (80).
 */

import { RefObject, useEffect, useState } from 'react';

const DEFAULT_ROWS = 80;
const DEFAULT_ROW_HEIGHT = 18;
const MIN_ROWS = 4;

export function useVisibleRows(
  containerRef: RefObject<HTMLElement | null>,
  rowHeightPx = DEFAULT_ROW_HEIGHT,
  minRows = MIN_ROWS
): number {
  const [visibleRows, setVisibleRows] = useState(DEFAULT_ROWS);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) {
      setVisibleRows(DEFAULT_ROWS);
      return;
    }

    const update = () => {
      const height = el.clientHeight;
      if (height <= 0) {
        setVisibleRows(DEFAULT_ROWS);
        return;
      }
      const rows = Math.max(minRows, Math.floor(height / rowHeightPx));
      setVisibleRows(rows);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [containerRef, rowHeightPx, minRows]);

  return visibleRows;
}
