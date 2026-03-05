/**
 * VANTAGE TERMINAL — Options Pricing Engine
 */

export interface OptionSpec {
    type: 'call' | 'put';
    spot: number;
    strike: number;
    timeToExpiry: number; // Years
    riskFreeRate: number;
    volatility: number;
}

export interface OptionGreeks {
    price: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
}

// Cumulative Normal Distribution Function (Abramowitz & Stegun approximation)
function normCDF(x: number): number {
    const t = 1 / (1 + 0.2316419 * Math.abs(x));
    const d = 0.3989423 * Math.exp(-x * x / 2);
    const p = t * (0.3193815 + t * (-0.3565638 + t * (1.7814779 + t * (-1.821256 + t * 1.330274))));
    return x > 0 ? 1 - d * p : d * p;
}

// Probability Density Function
function normPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

export function calculateGreeks(opt: OptionSpec): OptionGreeks {
    const { spot: S, strike: K, timeToExpiry: T, riskFreeRate: r, volatility: sigma } = opt;
    
    const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);

    const Nd1 = normCDF(d1);
    const Nd2 = normCDF(d2);
    const n_d1 = normPDF(d1);

    let price: number;
    let delta: number;
    let theta: number;
    let rho: number;

    if (opt.type === 'call') {
        price = S * Nd1 - K * Math.exp(-r * T) * Nd2;
        delta = Nd1;
        theta = (-S * n_d1 * sigma / (2 * Math.sqrt(T)) - r * K * Math.exp(-r * T) * Nd2) / 365;
        rho = (K * T * Math.exp(-r * T) * Nd2) / 100;
    } else {
        price = K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
        delta = Nd1 - 1;
        theta = (-S * n_d1 * sigma / (2 * Math.sqrt(T)) + r * K * Math.exp(-r * T) * normCDF(-d2)) / 365;
        rho = (-K * T * Math.exp(-r * T) * normCDF(-d2)) / 100;
    }

    const gamma = n_d1 / (S * sigma * Math.sqrt(T));
    const vega = (S * Math.sqrt(T) * n_d1) / 100;

    return { price, delta, gamma, theta, vega, rho };
}