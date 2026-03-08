export const TERMINAL_DENSITY = {
  header: {
    xl: 'h-[16px]',
    lg: 'h-[14px]',
    md: 'h-[12px]',
    sm: 'h-[10px]',
  },
  row: {
    lg: 'py-[2px]',
    md: 'py-[1px]',
    sm: 'py-[0px]',
  },
  text: {
    xs: 'text-[7px]',
    sm: 'text-[8px]',
    md: 'text-[9px]',
  },
  gap: {
    px: 'gap-px',
    xxs: 'gap-[1px]',
    xs: 'gap-[2px]',
  },
  paddingX: {
    tight: 'px-[2px]',
    compact: 'px-[3px]',
  },
  border: {
    tone: 'border-[#111]',
  },
} as const;

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
