/**
 * VANTAGE TERMINAL — Security Master & Screening Engine
 * 
 * Cross-asset instrument database and multi-filter screening system.
 * 
 * Security Master:
 * - Normalized instrument identifiers across asset classes
 * - Field-level access (Bloomberg FLDS equivalent)
 * - Cross-referencing (ticker, ISIN, CUSIP, FIGI)
 * 
 * Screening Engine:
 * - Composable filter predicates
 * - Multi-field screening with AND/OR logic
 * - Sortable results with customizable columns
 */

// ─── Asset Class Taxonomy ───────────────────────────────────────
export type AssetClass = 'Equity' | 'FixedIncome' | 'FX' | 'Commodity' | 'Crypto' | 'Index' | 'Derivative';
export type SecurityType =
    | 'Common Stock' | 'Preferred Stock' | 'ADR' | 'ETF' | 'REIT'
    | 'Government Bond' | 'Corporate Bond' | 'Municipal Bond' | 'ABS' | 'MBS'
    | 'Spot' | 'Forward' | 'Swap' | 'NDF'
    | 'Futures' | 'Spot Commodity'
    | 'Token' | 'Stablecoin'
    | 'Call Option' | 'Put Option' | 'Future' | 'Swap Contract'
    | 'Price Index' | 'Total Return Index';

// ─── Security Master Record ─────────────────────────────────────
export interface Security {
    id: string;
    ticker: string;
    name: string;
    assetClass: AssetClass;
    securityType: SecurityType;
    currency: string;
    exchange?: string;
    country?: string;
    sector?: string;
    industry?: string;
    isin?: string;
    cusip?: string;

    // Fundamental data fields
    marketCap?: number;
    peRatio?: number;
    pbRatio?: number;
    dividendYield?: number;
    beta?: number;
    eps?: number;
    revenue?: number;
    ebitda?: number;
    debtToEquity?: number;
    roe?: number;
    roa?: number;
    operatingMargin?: number;

    // Fixed income fields
    couponRate?: number;
    maturityDate?: string;
    creditRating?: string;
    yieldToMaturity?: number;
    duration?: number;
    convexity?: number;

    // Price/Performance
    currentPrice?: number;
    changePercent?: number;
    volume?: number;
    avgVolume20D?: number;
    high52W?: number;
    low52W?: number;
    ytdReturn?: number;
    return1Y?: number;
    return3Y?: number;
    volatility30D?: number;
}

// ─── Field Registry (FLDS Equivalent) ───────────────────────────
export interface FieldDefinition {
    id: string;
    name: string;
    category: string;
    dataType: 'number' | 'string' | 'date' | 'boolean';
    description: string;
    assetClasses: AssetClass[];
}

export const FIELD_REGISTRY: FieldDefinition[] = [
    // Identifiers
    { id: 'ID', name: 'Security ID', category: 'Identifier', dataType: 'string', description: 'Unique security identifier', assetClasses: ['Equity', 'FixedIncome', 'FX', 'Commodity', 'Crypto', 'Index', 'Derivative'] },
    { id: 'TICKER', name: 'Ticker', category: 'Identifier', dataType: 'string', description: 'Trading symbol', assetClasses: ['Equity', 'FixedIncome', 'FX', 'Commodity', 'Crypto', 'Index'] },
    { id: 'NAME', name: 'Name', category: 'Identifier', dataType: 'string', description: 'Full security name', assetClasses: ['Equity', 'FixedIncome', 'FX', 'Commodity', 'Crypto', 'Index', 'Derivative'] },
    { id: 'ISIN', name: 'ISIN', category: 'Identifier', dataType: 'string', description: 'International Securities Identification Number', assetClasses: ['Equity', 'FixedIncome'] },

    // Market Data
    { id: 'PX_LAST', name: 'Last Price', category: 'Market', dataType: 'number', description: 'Last traded price', assetClasses: ['Equity', 'FixedIncome', 'FX', 'Commodity', 'Crypto', 'Index'] },
    { id: 'CHG_PCT', name: 'Change %', category: 'Market', dataType: 'number', description: 'Percentage change', assetClasses: ['Equity', 'FixedIncome', 'FX', 'Commodity', 'Crypto', 'Index'] },
    { id: 'VOLUME', name: 'Volume', category: 'Market', dataType: 'number', description: 'Trading volume', assetClasses: ['Equity', 'Commodity', 'Crypto'] },
    { id: 'VOLATILITY_30D', name: '30D Volatility', category: 'Market', dataType: 'number', description: '30-day realized volatility', assetClasses: ['Equity', 'FX', 'Commodity', 'Crypto'] },

    // Fundamentals
    { id: 'MKT_CAP', name: 'Market Cap', category: 'Fundamental', dataType: 'number', description: 'Market capitalization', assetClasses: ['Equity'] },
    { id: 'PE_RATIO', name: 'P/E Ratio', category: 'Fundamental', dataType: 'number', description: 'Price to earnings ratio', assetClasses: ['Equity'] },
    { id: 'PB_RATIO', name: 'P/B Ratio', category: 'Fundamental', dataType: 'number', description: 'Price to book ratio', assetClasses: ['Equity'] },
    { id: 'DIV_YLD', name: 'Dividend Yield', category: 'Fundamental', dataType: 'number', description: 'Annual dividend yield', assetClasses: ['Equity'] },
    { id: 'BETA', name: 'Beta', category: 'Fundamental', dataType: 'number', description: 'Market beta', assetClasses: ['Equity'] },
    { id: 'ROE', name: 'Return on Equity', category: 'Fundamental', dataType: 'number', description: 'Return on equity', assetClasses: ['Equity'] },
    { id: 'DEBT_EQUITY', name: 'Debt/Equity', category: 'Fundamental', dataType: 'number', description: 'Debt to equity ratio', assetClasses: ['Equity'] },
    { id: 'OP_MARGIN', name: 'Operating Margin', category: 'Fundamental', dataType: 'number', description: 'Operating profit margin', assetClasses: ['Equity'] },

    // Fixed Income
    { id: 'CPN_RATE', name: 'Coupon Rate', category: 'Fixed Income', dataType: 'number', description: 'Annual coupon rate', assetClasses: ['FixedIncome'] },
    { id: 'MATURITY', name: 'Maturity Date', category: 'Fixed Income', dataType: 'date', description: 'Bond maturity date', assetClasses: ['FixedIncome'] },
    { id: 'CREDIT_RTG', name: 'Credit Rating', category: 'Fixed Income', dataType: 'string', description: 'Credit rating (S&P/Moody\'s)', assetClasses: ['FixedIncome'] },
    { id: 'YTM', name: 'Yield to Maturity', category: 'Fixed Income', dataType: 'number', description: 'Yield to maturity', assetClasses: ['FixedIncome'] },
    { id: 'DUR', name: 'Duration', category: 'Fixed Income', dataType: 'number', description: 'Modified duration', assetClasses: ['FixedIncome'] },
    { id: 'CONVEXITY', name: 'Convexity', category: 'Fixed Income', dataType: 'number', description: 'Bond convexity', assetClasses: ['FixedIncome'] },

    // Performance
    { id: 'YTD_RETURN', name: 'YTD Return', category: 'Performance', dataType: 'number', description: 'Year-to-date return', assetClasses: ['Equity', 'FixedIncome', 'Commodity', 'Crypto', 'Index'] },
    { id: 'RETURN_1Y', name: '1Y Return', category: 'Performance', dataType: 'number', description: '1-year total return', assetClasses: ['Equity', 'FixedIncome', 'Commodity', 'Crypto', 'Index'] },
    { id: 'HIGH_52W', name: '52W High', category: 'Performance', dataType: 'number', description: '52-week high price', assetClasses: ['Equity', 'Commodity', 'Crypto'] },
    { id: 'LOW_52W', name: '52W Low', category: 'Performance', dataType: 'number', description: '52-week low price', assetClasses: ['Equity', 'Commodity', 'Crypto'] },
];

// ─── Screening Engine ───────────────────────────────────────────
export type FilterOperator = 'gt' | 'gte' | 'lt' | 'lte' | 'eq' | 'neq' | 'between' | 'contains' | 'in';

export interface ScreenFilter {
    field: keyof Security;
    operator: FilterOperator;
    value: number | string | number[] | string[];
}

export interface ScreenConfig {
    assetClass?: AssetClass;
    filters: ScreenFilter[];
    sortBy?: keyof Security;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
}

/**
 * Apply filters to a security database.
 */
export function screenSecurities(database: Security[], config: ScreenConfig): Security[] {
    let results = [...database];

    // Filter by asset class
    if (config.assetClass) {
        results = results.filter(s => s.assetClass === config.assetClass);
    }

    // Apply each filter
    for (const filter of config.filters) {
        results = results.filter(security => {
            const value = security[filter.field];
            if (value === undefined || value === null) return false;

            switch (filter.operator) {
                case 'gt': return typeof value === 'number' && value > (filter.value as number);
                case 'gte': return typeof value === 'number' && value >= (filter.value as number);
                case 'lt': return typeof value === 'number' && value < (filter.value as number);
                case 'lte': return typeof value === 'number' && value <= (filter.value as number);
                case 'eq': return value === filter.value;
                case 'neq': return value !== filter.value;
                case 'between': {
                    const [low, high] = filter.value as number[];
                    return typeof value === 'number' && value >= low && value <= high;
                }
                case 'contains': return typeof value === 'string' && value.toLowerCase().includes((filter.value as string).toLowerCase());
                case 'in': return (filter.value as (string | number)[]).includes(value as string | number);
                default: return true;
            }
        });
    }

    // Sort
    if (config.sortBy) {
        const sortField = config.sortBy;
        const order = config.sortOrder === 'asc' ? 1 : -1;
        results.sort((a, b) => {
            const va = a[sortField];
            const vb = b[sortField];
            if (va === undefined) return 1;
            if (vb === undefined) return -1;
            if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * order;
            return String(va).localeCompare(String(vb)) * order;
        });
    }

    // Limit
    if (config.limit) {
        results = results.slice(0, config.limit);
    }

    return results;
}

// ─── Sample Security Database ───────────────────────────────────
export const SECURITY_MASTER: Security[] = [
    // Equities
    { id: 'AAPL', ticker: 'AAPL', name: 'Apple Inc.', assetClass: 'Equity', securityType: 'Common Stock', currency: 'USD', exchange: 'NASDAQ', country: 'US', sector: 'Technology', industry: 'Consumer Electronics', marketCap: 3200000000000, peRatio: 33.2, pbRatio: 48.5, dividendYield: 0.0044, beta: 1.24, eps: 6.73, revenue: 383000000000, roe: 1.47, operatingMargin: 0.304, currentPrice: 227.50, changePercent: -0.82, volume: 52000000, high52W: 260.10, low52W: 164.08, ytdReturn: 0.062 },
    { id: 'MSFT', ticker: 'MSFT', name: 'Microsoft Corp.', assetClass: 'Equity', securityType: 'Common Stock', currency: 'USD', exchange: 'NASDAQ', country: 'US', sector: 'Technology', industry: 'Software', marketCap: 3100000000000, peRatio: 36.8, pbRatio: 12.3, dividendYield: 0.0072, beta: 0.92, eps: 11.54, revenue: 236000000000, roe: 0.39, operatingMargin: 0.447, currentPrice: 415.80, changePercent: 0.34, volume: 28000000, high52W: 468.35, low52W: 362.90, ytdReturn: 0.041 },
    { id: 'NVDA', ticker: 'NVDA', name: 'NVIDIA Corp.', assetClass: 'Equity', securityType: 'Common Stock', currency: 'USD', exchange: 'NASDAQ', country: 'US', sector: 'Technology', industry: 'Semiconductors', marketCap: 2800000000000, peRatio: 65.4, pbRatio: 42.1, dividendYield: 0.0002, beta: 1.68, eps: 1.71, revenue: 130000000000, roe: 1.23, operatingMargin: 0.625, currentPrice: 115.20, changePercent: -1.45, volume: 310000000, high52W: 153.13, low52W: 47.32, ytdReturn: 0.085 },
    { id: 'AMZN', ticker: 'AMZN', name: 'Amazon.com Inc.', assetClass: 'Equity', securityType: 'Common Stock', currency: 'USD', exchange: 'NASDAQ', country: 'US', sector: 'Consumer Cyclical', industry: 'Internet Retail', marketCap: 2100000000000, peRatio: 42.3, pbRatio: 8.9, dividendYield: 0, beta: 1.15, eps: 4.82, revenue: 637000000000, roe: 0.22, operatingMargin: 0.108, currentPrice: 198.30, changePercent: 0.67, volume: 45000000, high52W: 242.52, low52W: 151.61, ytdReturn: -0.028 },
    { id: 'JPM', ticker: 'JPM', name: 'JPMorgan Chase & Co.', assetClass: 'Equity', securityType: 'Common Stock', currency: 'USD', exchange: 'NYSE', country: 'US', sector: 'Financial Services', industry: 'Banks—Diversified', marketCap: 680000000000, peRatio: 12.1, pbRatio: 2.1, dividendYield: 0.0207, beta: 1.05, eps: 19.75, revenue: 177000000000, roe: 0.17, operatingMargin: 0.38, currentPrice: 239.50, changePercent: -0.53, volume: 12000000, high52W: 280.25, low52W: 182.45, ytdReturn: 0.12 },
    { id: 'XOM', ticker: 'XOM', name: 'Exxon Mobil Corp.', assetClass: 'Equity', securityType: 'Common Stock', currency: 'USD', exchange: 'NYSE', country: 'US', sector: 'Energy', industry: 'Oil & Gas', marketCap: 480000000000, peRatio: 14.5, pbRatio: 2.0, dividendYield: 0.0335, beta: 0.82, eps: 7.84, revenue: 344000000000, roe: 0.19, operatingMargin: 0.122, currentPrice: 112.80, changePercent: 1.21, volume: 18000000, high52W: 126.34, low52W: 95.77, ytdReturn: 0.08 },
    { id: 'JNJ', ticker: 'JNJ', name: 'Johnson & Johnson', assetClass: 'Equity', securityType: 'Common Stock', currency: 'USD', exchange: 'NYSE', country: 'US', sector: 'Healthcare', industry: 'Pharmaceuticals', marketCap: 380000000000, peRatio: 23.4, pbRatio: 5.8, dividendYield: 0.032, beta: 0.55, eps: 6.70, revenue: 85000000000, roe: 0.21, operatingMargin: 0.265, currentPrice: 158.60, changePercent: 0.18, volume: 7500000, high52W: 172.38, low52W: 143.15, ytdReturn: 0.032 },
    { id: 'TSLA', ticker: 'TSLA', name: 'Tesla Inc.', assetClass: 'Equity', securityType: 'Common Stock', currency: 'USD', exchange: 'NASDAQ', country: 'US', sector: 'Consumer Cyclical', industry: 'Auto Manufacturers', marketCap: 780000000000, peRatio: 62.5, pbRatio: 12.4, dividendYield: 0, beta: 2.05, eps: 3.91, revenue: 96000000000, roe: 0.22, operatingMargin: 0.089, currentPrice: 245.40, changePercent: -2.35, volume: 95000000, high52W: 488.54, low52W: 138.80, ytdReturn: -0.04 },

    // Fixed Income
    { id: 'UST10Y', ticker: 'UST 10Y', name: 'US Treasury 10Y Note', assetClass: 'FixedIncome', securityType: 'Government Bond', currency: 'USD', country: 'US', couponRate: 0.04375, maturityDate: '2034-11-15', creditRating: 'AAA', yieldToMaturity: 0.0435, duration: 7.8, convexity: 72.3, currentPrice: 99.85, changePercent: -0.12 },
    { id: 'UST2Y', ticker: 'UST 2Y', name: 'US Treasury 2Y Note', assetClass: 'FixedIncome', securityType: 'Government Bond', currency: 'USD', country: 'US', couponRate: 0.045, maturityDate: '2027-03-15', creditRating: 'AAA', yieldToMaturity: 0.046, duration: 1.9, convexity: 4.2, currentPrice: 99.92, changePercent: -0.05 },
    { id: 'AAPL_BOND', ticker: 'AAPL 3.85 2043', name: 'Apple Inc. 3.85% 2043', assetClass: 'FixedIncome', securityType: 'Corporate Bond', currency: 'USD', country: 'US', sector: 'Technology', couponRate: 0.0385, maturityDate: '2043-05-04', creditRating: 'AA+', yieldToMaturity: 0.052, duration: 13.2, convexity: 245.6, currentPrice: 82.50, changePercent: 0.08 },
    { id: 'GS_BOND', ticker: 'GS 6.75 2037', name: 'Goldman Sachs 6.75% 2037', assetClass: 'FixedIncome', securityType: 'Corporate Bond', currency: 'USD', country: 'US', sector: 'Financial Services', couponRate: 0.0675, maturityDate: '2037-10-01', creditRating: 'A+', yieldToMaturity: 0.058, duration: 9.4, convexity: 118.5, currentPrice: 106.20, changePercent: -0.15 },

    // Commodities
    { id: 'GOLD', ticker: 'GC', name: 'Gold Spot', assetClass: 'Commodity', securityType: 'Spot Commodity', currency: 'USD', currentPrice: 2045.80, changePercent: 0.32, volume: 185000, high52W: 2152.30, low52W: 1810.50, ytdReturn: 0.045, volatility30D: 0.12 },
    { id: 'CRUDE', ticker: 'CL', name: 'Crude Oil WTI', assetClass: 'Commodity', securityType: 'Futures', currency: 'USD', currentPrice: 78.92, changePercent: -1.21, volume: 425000, high52W: 95.03, low52W: 63.64, ytdReturn: -0.02, volatility30D: 0.28 },
    { id: 'SILVER', ticker: 'SI', name: 'Silver Spot', assetClass: 'Commodity', securityType: 'Spot Commodity', currency: 'USD', currentPrice: 22.85, changePercent: -0.45, volume: 42000, high52W: 26.11, low52W: 20.09, ytdReturn: -0.035, volatility30D: 0.22 },

    // FX
    { id: 'EURUSD', ticker: 'EUR/USD', name: 'Euro / US Dollar', assetClass: 'FX', securityType: 'Spot', currency: 'USD', currentPrice: 1.0862, changePercent: 0.15, volume: 0, ytdReturn: 0.012, volatility30D: 0.065 },
    { id: 'GBPUSD', ticker: 'GBP/USD', name: 'British Pound / US Dollar', assetClass: 'FX', securityType: 'Spot', currency: 'USD', currentPrice: 1.2648, changePercent: -0.08, volume: 0, ytdReturn: -0.006, volatility30D: 0.072 },
    { id: 'USDJPY', ticker: 'USD/JPY', name: 'US Dollar / Japanese Yen', assetClass: 'FX', securityType: 'Spot', currency: 'JPY', currentPrice: 150.42, changePercent: 0.28, volume: 0, ytdReturn: 0.065, volatility30D: 0.085 },

    // Crypto
    { id: 'BTCUSD', ticker: 'BTC/USD', name: 'Bitcoin', assetClass: 'Crypto', securityType: 'Token', currency: 'USD', currentPrice: 63450.00, changePercent: -1.82, volume: 28000000000, high52W: 73750.00, low52W: 25200.00, ytdReturn: 0.48, volatility30D: 0.52 },
    { id: 'ETHUSD', ticker: 'ETH/USD', name: 'Ethereum', assetClass: 'Crypto', securityType: 'Token', currency: 'USD', currentPrice: 3420.00, changePercent: -2.15, volume: 15000000000, high52W: 4092.00, low52W: 1523.00, ytdReturn: 0.52, volatility30D: 0.58 },

    // Indices
    { id: 'SPX', ticker: 'SPX', name: 'S&P 500', assetClass: 'Index', securityType: 'Price Index', currency: 'USD', country: 'US', currentPrice: 5152.40, changePercent: -0.56, ytdReturn: 0.085, volatility30D: 0.12 },
    { id: 'NDX', ticker: 'NDX', name: 'Nasdaq 100', assetClass: 'Index', securityType: 'Price Index', currency: 'USD', country: 'US', currentPrice: 18642.50, changePercent: -0.88, ytdReturn: 0.078, volatility30D: 0.16 },
    { id: 'DJI', ticker: 'DJI', name: 'Dow Jones Industrial Average', assetClass: 'Index', securityType: 'Price Index', currency: 'USD', country: 'US', currentPrice: 39150.00, changePercent: -0.32, ytdReturn: 0.042, volatility30D: 0.10 },
];
