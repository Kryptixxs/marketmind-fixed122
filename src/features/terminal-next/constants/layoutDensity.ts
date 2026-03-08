export const LayoutDensity = {
  headerHeightPx: 32,
  rowHeightPx: 24,
  padding: {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
  },
  typography: {
    scale: {
      tiny: '0.65rem',
      small: '0.75rem',
      base: '0.875rem',
      large: '1rem',
      h1: '1.25rem',
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
    },
  },
  colors: {
    border: 'border-slate-800',
    borderFocus: 'border-slate-600',
    bgPrimary: 'bg-slate-950',
    bgSecondary: 'bg-slate-900',
    textPrimary: 'text-slate-200',
    textSecondary: 'text-slate-400',
    textMuted: 'text-slate-500',
  },
  spacing: {
    unit: 4,
    gap: 8,
  },
};

export const TERMINAL_STRUCTURE_POLICY = {
  bandRows: 'grid-rows-[0.25fr_0.45fr_0.30fr]',
  maxPanels: {
    primary: 6,
    secondary: 8,
    tertiary: 8,
  },
  chart: {
    maxWidthRatio: 0.3,
    compactHeightClass: 'h-[84px]',
  },
} as const;
