'use client';

import React from 'react';
import { DENSITY } from '../../constants/layoutDensity';

type TileHotkeyType = 'cycle' | 'enter' | 'enter_new_pane' | 'inspect' | 'menu';

export interface TileHotkeyEventDetail {
  panelIdx: number;
  type: TileHotkeyType;
}

export const TILE_HOTKEY_EVENT = 'vantage-tile-hotkey';

interface TileActionHandlers {
  onEnter?: () => void;
  onEnterNewPane?: () => void;
  onInspect?: () => void;
  onMenu?: (x: number, y: number) => void;
}

interface TileLayoutContextValue {
  panelIdx: number;
  focusedTileId: string | null;
  setFocusedTileId: (id: string) => void;
  registerTile: (id: string, handlers: TileActionHandlers) => () => void;
}

const TileLayoutCtx = React.createContext<TileLayoutContextValue | null>(null);

function useTileLayoutCtx() {
  const ctx = React.useContext(TileLayoutCtx);
  if (!ctx) throw new Error('Tile components must be used inside TileLayoutRoot');
  return ctx;
}

export function TileLayoutRoot({ panelIdx, children }: { panelIdx: number; children: React.ReactNode }) {
  const handlersRef = React.useRef(new Map<string, TileActionHandlers>());
  const orderRef = React.useRef<string[]>([]);
  const hostRef = React.useRef<HTMLDivElement>(null);
  const [focusedTileId, setFocusedTileIdState] = React.useState<string | null>(null);

  const setFocusedTileId = React.useCallback((id: string) => {
    setFocusedTileIdState(id);
  }, []);

  const registerTile = React.useCallback((id: string, handlers: TileActionHandlers) => {
    handlersRef.current.set(id, handlers);
    if (!orderRef.current.includes(id)) orderRef.current.push(id);
    setFocusedTileIdState((prev) => prev ?? id);
    return () => {
      handlersRef.current.delete(id);
      orderRef.current = orderRef.current.filter((x) => x !== id);
      setFocusedTileIdState((prev) => {
        if (prev !== id) return prev;
        return orderRef.current[0] ?? null;
      });
    };
  }, []);

  React.useEffect(() => {
    const onHotkey = (ev: Event) => {
      const e = ev as CustomEvent<TileHotkeyEventDetail>;
      if (!e.detail || e.detail.panelIdx !== panelIdx) return;
      const ids = orderRef.current;
      if (ids.length === 0) return;
      const activeId = focusedTileId && ids.includes(focusedTileId) ? focusedTileId : ids[0]!;
      if (e.detail.type === 'cycle') {
        const idx = ids.indexOf(activeId);
        const next = ids[(idx + 1) % ids.length] ?? ids[0]!;
        setFocusedTileIdState(next);
        e.preventDefault();
        return;
      }
      const current = handlersRef.current.get(activeId);
      if (!current) return;
      if (e.detail.type === 'enter' && current.onEnter) {
        current.onEnter();
        e.preventDefault();
        return;
      }
      if (e.detail.type === 'enter_new_pane' && current.onEnterNewPane) {
        current.onEnterNewPane();
        e.preventDefault();
        return;
      }
      if (e.detail.type === 'inspect' && current.onInspect) {
        current.onInspect();
        e.preventDefault();
        return;
      }
      if (e.detail.type === 'menu' && current.onMenu) {
        const rect = hostRef.current?.getBoundingClientRect();
        const x = rect ? Math.round(rect.left + rect.width * 0.5) : window.innerWidth / 2;
        const y = rect ? Math.round(rect.top + 20) : window.innerHeight / 2;
        current.onMenu(x, y);
        e.preventDefault();
      }
    };
    window.addEventListener(TILE_HOTKEY_EVENT, onHotkey);
    return () => window.removeEventListener(TILE_HOTKEY_EVENT, onHotkey);
  }, [panelIdx, focusedTileId]);

  const value = React.useMemo<TileLayoutContextValue>(() => ({
    panelIdx,
    focusedTileId,
    setFocusedTileId,
    registerTile,
  }), [panelIdx, focusedTileId, setFocusedTileId, registerTile]);

  return (
    <TileLayoutCtx.Provider value={value}>
      <div ref={hostRef} className="h-full min-h-0">
        {children}
      </div>
    </TileLayoutCtx.Provider>
  );
}

export interface TileGridSpec {
  columns: string;
  rows: string;
  areas: string[];
}

export function TileGrid({ spec, children }: { spec: TileGridSpec; children: React.ReactNode }) {
  return (
    <div
      className="grid h-full min-h-0 w-full"
      style={{
        gridTemplateColumns: spec.columns,
        gridTemplateRows: spec.rows,
        gridTemplateAreas: spec.areas.map((a) => `"${a}"`).join(' '),
        gap: 1,
        background: DENSITY.gridlineColor,
      }}
    >
      {children}
    </div>
  );
}

export function TileCell({ area, children }: { area: string; children: React.ReactNode }) {
  return <div style={{ gridArea: area, minHeight: 0, minWidth: 0 }}>{children}</div>;
}

export function TerminalTile({
  id,
  title,
  status,
  shortcuts,
  footer,
  children,
  onEnter,
  onEnterNewPane,
  onInspect,
  onMenu,
  onShortcut,
}: {
  id: string;
  title: string;
  status?: string;
  shortcuts?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
  onEnter?: () => void;
  onEnterNewPane?: () => void;
  onInspect?: () => void;
  onMenu?: (x: number, y: number) => void;
  onShortcut?: () => void;
}) {
  const { focusedTileId, setFocusedTileId, registerTile } = useTileLayoutCtx();
  const isFocused = focusedTileId === id;
  React.useEffect(() => registerTile(id, { onEnter, onEnterNewPane, onInspect, onMenu }), [id, onEnter, onEnterNewPane, onInspect, onMenu, registerTile]);
  return (
    <div
      className="flex flex-col h-full min-h-0 overflow-hidden"
      onClick={() => setFocusedTileId(id)}
      style={{
        background: DENSITY.panelBg,
        border: `1px solid ${isFocused ? DENSITY.rowSelectedMarker : DENSITY.borderColor}`,
        boxShadow: isFocused ? `inset 2px 0 0 ${DENSITY.rowSelectedMarker}` : undefined,
      }}
    >
      <div
        className="flex items-center justify-between flex-none"
        style={{
          height: 14,
          padding: `0 ${DENSITY.pad4}px`,
          borderBottom: `1px solid ${DENSITY.gridlineColor}`,
          fontSize: DENSITY.fontSizeTiny,
          color: DENSITY.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          background: DENSITY.panelBgAlt,
        }}
      >
        <span className="truncate" style={{ color: DENSITY.textPrimary }}>{title}</span>
        <span className="truncate flex items-center gap-1" style={{ color: DENSITY.textDim }}>
          {status ? `${status}${shortcuts ? ' • ' : ''}` : ''}
          {shortcuts ? (
            onShortcut ? (
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onShortcut(); }}
                style={{ background: 'none', border: 'none', color: DENSITY.accentCyan, fontSize: DENSITY.fontSizeTiny, padding: 0, cursor: 'pointer' }}
                title="Tile shortcut"
              >
                {shortcuts}
              </button>
            ) : shortcuts
          ) : null}
        </span>
      </div>
      <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">{children}</div>
      {footer ? (
        <div
          className="flex-none"
          style={{
            height: 11,
            borderTop: `1px solid ${DENSITY.gridlineColor}`,
            padding: `0 ${DENSITY.pad4}px`,
            fontSize: DENSITY.fontSizeTiny,
            color: DENSITY.textDim,
            background: DENSITY.panelBgAlt,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {footer}
        </div>
      ) : null}
    </div>
  );
}

