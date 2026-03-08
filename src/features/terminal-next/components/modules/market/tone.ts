import { ModuleTableRow } from '../../../types';

export function toneClass(tone: ModuleTableRow['tone']) {
  if (tone === 'positive') return 'text-[#4ce0a5]';
  if (tone === 'negative') return 'text-[#ff7ca3]';
  if (tone === 'accent') return 'text-[#8cc7f3]';
  if (tone === 'warning') return 'text-[#f4cf76]';
  return 'text-[#d9e5f5]';
}
