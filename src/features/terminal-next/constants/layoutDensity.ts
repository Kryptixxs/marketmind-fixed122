export const DENSITY = {
  // ── Structure ──────────────────────────────────────────────
  panelHeaderHeightPx: 22,
  toolbarHeightPx: 24,
  commandBarHeightPx: 26,
  rowHeightPx: 20,
  rowHeightCompactPx: 16,
  pad2: 2,
  pad4: 6,
  // ── Surfaces ───────────────────────────────────────────────
  // bg hierarchy: base < surface < surfaceAlt < panel < panelAlt
  bgBase: '#080e14',
  bgSurface: '#0d1620',
  bgSurfaceAlt: '#132030',
  panelBg: '#0d1620',
  panelBgAlt: '#132030',
  bgHeader: '#0c2a5c',        // rich navy for focused panel header
  bgHeaderUnfocused: '#0d1620',
  // ── Row states ─────────────────────────────────────────────
  rowZebra: '#0f1d28',
  rowHover: '#162436',
  rowSelectedBg: '#1c3a58',
  rowSelectedMarker: '#4db8ff',
  groupSeparator: '#1c2d3e',
  // ── Borders ────────────────────────────────────────────────
  borderColor: '#2a3e52',
  gridlineColor: '#1a2a38',
  focusBorderColor: '#2a7fff',
  // ── Accent palette ─────────────────────────────────────────
  accentAmber: '#f5a623',     // slightly warmer gold
  accentGreen: '#3dd68c',
  accentRed: '#f25373',
  accentCyan: '#4dbdff',
  accentBlue: '#1a7aff',
  accentOrange: '#f07830',
  accentWhite: '#f0f4fa',
  pos: '#3dd68c',
  neg: '#f25373',
  // ── Text hierarchy ─────────────────────────────────────────
  textPrimary: '#dce8f4',     // bright readable white-blue
  textSecondary: '#8ba8c4',
  textDim: '#5a7691',
  textMuted: '#5a7691',
  // ── Typography ─────────────────────────────────────────────
  fontSizeDefault: '12px',
  fontSizeHeader: '11px',
  fontSizeMicro: '10px',
  fontSizeTiny: '10px',       // raised — 8px was too small
  fontFamily: "'Cascadia Mono','JetBrains Mono','Consolas','Courier New',monospace",
  // ── Misc ───────────────────────────────────────────────────
  scrollbarWidth: 4,
  flashDurationMs: 150,
  zIndexDropdown: 10,
  zIndexOverlay: 30,
  zIndexInspector: 50,
  zIndexContextMenu: 9999,
} as const;

export type DensityTokens = typeof DENSITY;

/** Canonical style for <input> and <select> elements — use instead of hardcoded #000/#222 */
export const inputStyle = {
  background: DENSITY.bgBase,
  border: `1px solid ${DENSITY.borderColor}`,
  color: DENSITY.textPrimary,
  fontSize: DENSITY.fontSizeTiny,
  fontFamily: DENSITY.fontFamily,
  outline: 'none',
} as const satisfies React.CSSProperties;

/** Style for interactive toolbar/filter buttons */
export const toolbarBtnStyle = (active = false): React.CSSProperties => ({
  background: active ? DENSITY.accentAmber : DENSITY.bgSurfaceAlt,
  color: active ? '#000' : DENSITY.textSecondary,
  border: `1px solid ${active ? DENSITY.accentAmber : DENSITY.borderColor}`,
  fontSize: DENSITY.fontSizeTiny,
  fontFamily: DENSITY.fontFamily,
  padding: '2px 8px',
  cursor: 'pointer',
  fontWeight: active ? 700 : 400,
});

export const TERMINAL_STRUCTURE_POLICY = {
  bandRows: 'grid-rows-[2fr_1fr_1fr]',
  maxPanels: {
    primary: 4,
    secondary: 4,
    tertiary: 4,
  },
} as const;
