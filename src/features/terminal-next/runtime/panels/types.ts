export enum PanelType {
  VERDICT = 'VERDICT',
  SNAPSHOT = 'SNAPSHOT',
  DIAGNOSTIC = 'DIAGNOSTIC',
  FLOW = 'FLOW',
  VULNERABILITY = 'VULNERABILITY',
  ORDER_STATE = 'ORDER_STATE',
  HISTORICAL = 'HISTORICAL',
}

export enum BandLayer {
  PRIMARY = 'PRIMARY',
  SECONDARY = 'SECONDARY',
  TERTIARY = 'TERTIARY',
}

export interface PanelConfig {
  id: string;
  type: PanelType;
  title: string;
  priority?: number; // lower is higher priority
  minHeightUnits?: number; // used to calculate min-height
}
