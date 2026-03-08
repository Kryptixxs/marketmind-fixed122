import { ReactNode } from 'react';
import { BandSpec } from '../BandLayout';

export interface TerminalModuleContext {
  activeSymbol: string;
  timeframe: string;
  state: any; // Using any for now, or you can import TerminalState
}

export interface TerminalModuleOutput {
  primaryPanels: ReactNode;
  secondaryPanels: ReactNode;
  tertiaryPanels: ReactNode;
}

export interface ModuleContract<TModel = any> {
  id: string;
  title: string;
  decisionPrompt: string;
  
  // Row fractions for the primary, secondary, and tertiary bands
  bandSpec: BandSpec;
  
  // A single unified data model for the module
  // Both table rows and chart series must be derived from this model
  buildModel: (context: TerminalModuleContext) => TModel;
  
  // Render function that takes the built model and returns panel components mapped to bands
  render: (model: TModel) => TerminalModuleOutput;
}
