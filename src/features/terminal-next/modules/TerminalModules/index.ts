/**
 * Terminal Module Registry – Bloomberg 4-Monitor Architecture
 * Every module is self-contained and fits into any grid cell.
 */

import type { TerminalModuleDefinition } from './types';
import { TableModule } from './TableModule';
import { ChartModule } from './ChartModule';
import { NewsModule } from './NewsModule';
import { HeatmapModule } from './HeatmapModule';

export * from './types';
export { TableModule } from './TableModule';
export { ChartModule } from './ChartModule';
export { NewsModule } from './NewsModule';
export { HeatmapModule } from './HeatmapModule';

export const TERMINAL_MODULES: Record<string, TerminalModuleDefinition> = {
  table: {
    id: 'table',
    label: 'Table',
    Component: TableModule,
    supportedSubGrids: ['1x1', '1x2', '2x2'],
    defaultSubGrid: '1x1',
  },
  chart: {
    id: 'chart',
    label: 'Chart',
    Component: ChartModule,
    supportedSubGrids: ['1x1', '2x2', '3x3'],
    defaultSubGrid: '1x1',
  },
  news: {
    id: 'news',
    label: 'News',
    Component: NewsModule,
    supportedSubGrids: ['1x1', '1x2', '2x1'],
    defaultSubGrid: '1x2',
  },
  heatmap: {
    id: 'heatmap',
    label: 'Heatmap',
    Component: HeatmapModule,
    supportedSubGrids: ['1x1', '2x2', '3x3'],
    defaultSubGrid: '2x2',
  },
};
