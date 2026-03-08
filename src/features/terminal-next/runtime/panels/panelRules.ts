import { PanelType, BandLayer } from './types';

export const MAX_PANELS_PER_BAND: Record<BandLayer, number> = {
  [BandLayer.PRIMARY]: 6,
  [BandLayer.SECONDARY]: 8,
  [BandLayer.TERTIARY]: 8,
};

// Panel types mapped to their default visual significance
export const PANEL_DEFAULT_PRIORITY: Record<PanelType, number> = {
  [PanelType.VERDICT]: 10,
  [PanelType.ORDER_STATE]: 20,
  [PanelType.FLOW]: 30,
  [PanelType.SNAPSHOT]: 40,
  [PanelType.DIAGNOSTIC]: 50,
  [PanelType.VULNERABILITY]: 60,
  [PanelType.HISTORICAL]: 90,
};

// PanelTypes that default to collapsed state
export const DEFAULT_COLLAPSED_PANELS: PanelType[] = [
  PanelType.HISTORICAL,
];

/**
 * Validates if the given panels exceed the band limits
 */
export function validateBandLimits(layer: BandLayer, panelCount: number): boolean {
  return panelCount <= MAX_PANELS_PER_BAND[layer];
}

export function shouldPanelDefaultCollapse(type: PanelType): boolean {
  return DEFAULT_COLLAPSED_PANELS.includes(type);
}
