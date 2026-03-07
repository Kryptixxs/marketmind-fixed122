/**
 * Terminal theme: pure black background, red and green accents.
 */
export const TERM = {
  bg: 'bg-black',
  bgMain: 'bg-black',
  bgPanel: 'bg-black',
  bgPanelAlt: 'bg-[#0a0a0a]',
  bgHeader: 'bg-[#0f0f0f]',
  border: 'border-[#1a1a1a]',
  borderLight: 'border-[#262626]',
  text: 'text-white',
  textMuted: 'text-gray-400',
  textDim: 'text-gray-500',
  accent: 'text-green-500',
  positive: 'text-green-500',
  negative: 'text-red-500',
  hover: 'hover:bg-[#0f0f0f]',
  active: 'bg-[#1a1a1a]',
  activeAccent: 'bg-[#0d1f0d] text-green-400 border-green-600',
} as const;
