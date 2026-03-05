/**
 * VANTAGE TERMINAL — Command Registry
 */

export interface TerminalFunction {
    code: string;
    name: string;
    route: string;
    category: 'ANALYTICS' | 'DATA' | 'RISK' | 'EXECUTION';
    description: string;
}

export const COMMANDS: Record<string, TerminalFunction> = {
    'FA': { code: 'FA', name: 'Financial Analysis', route: '/fa', category: 'DATA', description: 'Fundamental statement analysis' },
    'FI': { code: 'FI', name: 'Fixed Income', route: '/fi', category: 'ANALYTICS', description: 'Bond pricing and yield curve' },
    'OVME': { code: 'OVME', name: 'Option Valuation', route: '/options', category: 'ANALYTICS', description: 'Derivatives pricing and Greeks' },
    'EQS': { code: 'EQS', name: 'Equity Screening', route: '/screener', category: 'DATA', description: 'Multi-asset screening engine' },
    'RISK': { code: 'RISK', name: 'Risk Console', route: '/risk', category: 'RISK', description: 'Portfolio risk and VaR' },
    'PORT': { code: 'PORT', name: 'Portfolio Analytics', route: '/portfolio', category: 'RISK', description: 'Attribution and factor exposure' },
};