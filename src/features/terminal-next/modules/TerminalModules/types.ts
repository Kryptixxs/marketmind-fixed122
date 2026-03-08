/**
 * Terminal Modules – Bloomberg 4-Monitor Architecture
 * Every module is self-contained and fits into any grid cell.
 */

import { ReactNode } from 'react';

/** Props every TerminalModule slot receives – agnostic to quadrant position */
export interface ModuleSlotProps {
  /** Unique id for this slot instance */
  slotId: string;
  /** Optional context symbol for data binding */
  symbol?: string;
  /** Optional density preset */
  density?: 'compact' | 'default' | 'spacious';
  /** Optional override for children/layout hints */
  children?: ReactNode;
}

/** Sub-grid layout for a Virtual Monitor interior */
export type SubGridLayout = '1x1' | '1x2' | '2x1' | '2x2' | '3x3';

/** Registry entry for a TerminalModule */
export interface TerminalModuleDefinition {
  id: string;
  label: string;
  /** Component to render – fits any grid cell */
  Component: React.ComponentType<ModuleSlotProps>;
  /** Supported layouts when this module owns a full quadrant */
  supportedSubGrids?: SubGridLayout[];
  /** Default sub-grid when dropped into a quadrant */
  defaultSubGrid?: SubGridLayout;
}
