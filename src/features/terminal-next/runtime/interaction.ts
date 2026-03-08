'use client';

import type { DrillIntent } from './entities/linkResolver';

type ModifierEvent = { shiftKey: boolean; altKey: boolean };

export function intentFromMouseEvent(e: ModifierEvent): DrillIntent {
  if (e.altKey) return 'INSPECT_OVERLAY';
  if (e.shiftKey) return 'OPEN_IN_NEW_PANE';
  return 'OPEN_IN_PLACE';
}

export const INTERACTION_HINT = 'Click: drill  •  Shift+Click: send to new pane  •  Alt+Click: inspect  •  Right-click: actions';
