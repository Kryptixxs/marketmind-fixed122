import { PanelType } from '../../runtime/panels/types';

export const CHART_COMPACT_MARGINS = {
  top: 5,
  right: 5,
  bottom: 5,
  left: 5,
};

// What percentage of a panel's height a chart may consume
export const MAX_CHART_FOOTPRINT_PERCENTAGE: Record<PanelType, number> = {
  [PanelType.VERDICT]: 0, // No charts in verdict
  [PanelType.ORDER_STATE]: 0,
  [PanelType.SNAPSHOT]: 30,
  [PanelType.DIAGNOSTIC]: 50,
  [PanelType.FLOW]: 40,
  [PanelType.VULNERABILITY]: 30,
  [PanelType.HISTORICAL]: 80,
};

export function canRenderChartInPanel(panelType: PanelType): boolean {
  return MAX_CHART_FOOTPRINT_PERCENTAGE[panelType] > 0;
}
