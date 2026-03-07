/**
 * Curated supply chain / key customers data.
 * Sources: 10-K filings, public disclosures, industry reports.
 * Use DES module to find "who [company] trades with".
 */

export interface SupplyChainEntry {
  name: string;
  type: 'customer' | 'supplier' | 'partner';
  segment?: string;
  note?: string;
}

export interface SupplyChainData {
  symbol: string;
  name: string;
  customers: SupplyChainEntry[];
  suppliers: SupplyChainEntry[];
  partners: SupplyChainEntry[];
}

const SUPPLY_CHAIN_DB: Record<string, SupplyChainData> = {
  PLTR: {
    symbol: 'PLTR',
    name: 'Palantir Technologies',
    customers: [
      { name: 'US Army', type: 'customer', segment: 'Gov', note: 'TITAN, AIP' },
      { name: 'US DoD / Defense', type: 'customer', segment: 'Gov' },
      { name: 'NHS (UK)', type: 'customer', segment: 'Gov', note: 'Health' },
      { name: 'FDA', type: 'customer', segment: 'Gov' },
      { name: 'NASA', type: 'customer', segment: 'Gov' },
      { name: 'CBP / DHS', type: 'customer', segment: 'Gov' },
      { name: 'BP', type: 'customer', segment: 'Commercial', note: 'Foundry' },
      { name: 'Hertz', type: 'customer', segment: 'Commercial' },
      { name: 'Jacobs Engineering', type: 'customer', segment: 'Commercial' },
      { name: 'Cleveland Clinic', type: 'customer', segment: 'Health' },
    ],
    suppliers: [
      { name: 'AWS', type: 'supplier', note: 'Cloud infra' },
      { name: 'Azure', type: 'supplier', note: 'Cloud infra' },
      { name: 'GCP', type: 'supplier', note: 'Cloud infra' },
    ],
    partners: [
      { name: 'Microsoft', type: 'partner', note: 'Azure integration' },
      { name: 'Oracle', type: 'partner' },
    ],
  },
  AAPL: {
    symbol: 'AAPL',
    name: 'Apple Inc.',
    customers: [
      { name: 'Consumer retail', type: 'customer', segment: 'Direct' },
      { name: 'Carriers (AT&T, Verizon, T-Mobile)', type: 'customer', segment: 'Channel' },
      { name: 'Enterprise (Fortune 500)', type: 'customer', segment: 'B2B' },
      { name: 'Education', type: 'customer', segment: 'Institutional' },
    ],
    suppliers: [
      { name: 'Foxconn', type: 'supplier', note: 'Assembly' },
      { name: 'TSMC', type: 'supplier', note: 'A-series, M-series chips' },
      { name: 'Samsung', type: 'supplier', note: 'Displays' },
      { name: 'Qualcomm', type: 'supplier', note: 'Modems' },
      { name: 'Broadcom', type: 'supplier' },
      { name: 'SK Hynix', type: 'supplier', note: 'Memory' },
    ],
    partners: [
      { name: 'Google', type: 'partner', note: 'Search default' },
      { name: 'Samsung', type: 'partner', note: 'Components' },
    ],
  },
  MSFT: {
    symbol: 'MSFT',
    name: 'Microsoft Corp.',
    customers: [
      { name: 'Enterprise (Azure, Office 365)', type: 'customer', segment: 'B2B' },
      { name: 'US Govt', type: 'customer', segment: 'Gov' },
      { name: 'Healthcare (Epic, Cerner)', type: 'customer', segment: 'Health' },
      { name: 'Gaming (Xbox)', type: 'customer', segment: 'Consumer' },
    ],
    suppliers: [
      { name: 'AMD', type: 'supplier', note: 'Xbox chips' },
      { name: 'Intel', type: 'supplier' },
      { name: 'NVIDIA', type: 'supplier', note: 'AI infra' },
    ],
    partners: [
      { name: 'OpenAI', type: 'partner', note: 'Azure AI' },
      { name: 'SAP', type: 'partner' },
      { name: 'Salesforce', type: 'partner' },
    ],
  },
  NVDA: {
    symbol: 'NVDA',
    name: 'NVIDIA Corp.',
    customers: [
      { name: 'Microsoft', type: 'customer', segment: 'Cloud/AI' },
      { name: 'Meta', type: 'customer', segment: 'Cloud/AI' },
      { name: 'Google', type: 'customer', segment: 'Cloud/AI' },
      { name: 'Amazon', type: 'customer', segment: 'Cloud/AI' },
      { name: 'Tesla', type: 'customer', segment: 'Auto' },
      { name: 'Oracle', type: 'customer', segment: 'Enterprise' },
      { name: 'Dell, HP, Lenovo', type: 'customer', segment: 'OEM' },
    ],
    suppliers: [
      { name: 'TSMC', type: 'supplier', note: 'Fab' },
      { name: 'Samsung', type: 'supplier', note: 'Memory, packaging' },
      { name: 'SK Hynix', type: 'supplier' },
    ],
    partners: [
      { name: 'VMware', type: 'partner' },
      { name: 'Red Hat', type: 'partner' },
    ],
  },
  AMZN: {
    symbol: 'AMZN',
    name: 'Amazon.com',
    customers: [
      { name: 'Prime / Retail', type: 'customer', segment: 'Consumer' },
      { name: 'AWS enterprise', type: 'customer', segment: 'B2B' },
      { name: 'SMB sellers', type: 'customer', segment: 'Marketplace' },
    ],
    suppliers: [
      { name: 'Third-party sellers', type: 'supplier', note: 'Marketplace' },
      { name: 'Carriers (UPS, FedEx, USPS)', type: 'supplier' },
    ],
    partners: [
      { name: 'Shopify', type: 'partner' },
      { name: 'Salesforce', type: 'partner' },
    ],
  },
  TSLA: {
    symbol: 'TSLA',
    name: 'Tesla Inc.',
    customers: [
      { name: 'Consumer (direct sales)', type: 'customer', segment: 'Auto' },
      { name: 'Fleet / Rental', type: 'customer', segment: 'B2B' },
      { name: 'Energy storage (utilities)', type: 'customer', segment: 'Energy' },
    ],
    suppliers: [
      { name: 'Panasonic', type: 'supplier', note: 'Batteries' },
      { name: 'CATL', type: 'supplier', note: 'Batteries' },
      { name: 'LG Energy', type: 'supplier' },
    ],
    partners: [
      { name: 'NVIDIA', type: 'partner', note: 'FSD compute' },
    ],
  },
  META: {
    symbol: 'META',
    name: 'Meta Platforms',
    customers: [
      { name: 'Advertisers', type: 'customer', segment: 'Ads' },
      { name: 'SMB / Agencies', type: 'customer', segment: 'Ads' },
    ],
    suppliers: [
      { name: 'NVIDIA', type: 'supplier', note: 'AI training' },
      { name: 'AMD', type: 'supplier' },
    ],
    partners: [
      { name: 'Qualcomm', type: 'partner', note: 'VR/AR' },
    ],
  },
  GOOGL: {
    symbol: 'GOOGL',
    name: 'Alphabet',
    customers: [
      { name: 'Advertisers', type: 'customer', segment: 'Ads' },
      { name: 'Cloud (GCP)', type: 'customer', segment: 'B2B' },
      { name: 'Android OEMs', type: 'customer', segment: 'Mobile' },
    ],
    suppliers: [
      { name: 'NVIDIA', type: 'supplier' },
      { name: 'Broadcom', type: 'supplier' },
    ],
    partners: [
      { name: 'Apple', type: 'partner', note: 'Search default' },
    ],
  },
};

export function getSupplyChain(symbol: string): SupplyChainData | null {
  const sym = symbol.toUpperCase().replace(/\s+.*$/, '');
  return SUPPLY_CHAIN_DB[sym] ?? null;
}

/** All symbols in the supply chain DB (for seed migration) */
export const SUPPLY_CHAIN_SYMBOLS = Object.keys(SUPPLY_CHAIN_DB) as string[];
