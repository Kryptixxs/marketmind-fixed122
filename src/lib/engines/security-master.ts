/**
 * VANTAGE TERMINAL — Security Master
 * Normalized instrument database and field indexing.
 */

export type AssetClass = 'EQUITY' | 'FIXED_INCOME' | 'FX' | 'COMMODITY' | 'CRYPTO' | 'INDEX';

export interface SecurityRecord {
    id: string;
    ticker: string;
    name: string;
    assetClass: AssetClass;
    currency: string;
    exchange?: string;
    isin?: string;
    cusip?: string;
    // Asset specific
    maturityDate?: string;
    coupon?: number;
    strike?: number;
}

export interface FieldDefinition {
    id: string;
    name: string;
    dataType: 'NUMBER' | 'STRING' | 'DATE' | 'PERCENT';
    description: string;
}

export const FIELD_REGISTRY: Record<string, FieldDefinition> = {
    'PX_LAST': { id: 'PX_LAST', name: 'Last Price', dataType: 'NUMBER', description: 'Last traded price' },
    'YLD_YTM': { id: 'YLD_YTM', name: 'Yield to Maturity', dataType: 'PERCENT', description: 'Annualized yield to maturity' },
    'DUR_MOD': { id: 'DUR_MOD', name: 'Modified Duration', dataType: 'NUMBER', description: 'Price sensitivity to interest rates' },
    'IVOL_MID': { id: 'IVOL_MID', name: 'Implied Volatility', dataType: 'PERCENT', description: 'Mid-market implied volatility' },
    'PE_RATIO': { id: 'PE_RATIO', name: 'P/E Ratio', dataType: 'NUMBER', description: 'Price to earnings ratio' },
};