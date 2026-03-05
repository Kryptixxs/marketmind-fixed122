/**
 * VANTAGE TERMINAL — Options Pricing Engine
 * 
 * Production-grade derivatives mathematics:
 * - Black-Scholes pricing (European calls/puts)
 * - Full Greeks chain (Delta, Gamma, Theta, Vega, Rho)
 * - Implied Volatility solver (Brent's method)
 * - Put-Call Parity verification
 * - P&L diagram computation
 * - Multi-leg strategy payoff (spreads, straddles, condors)
 */

// ─── Type Definitions ───────────────────────────────────────────
export interface OptionSpec {
    type: 'call' | 'put';
    spot: number;           // Current underlying price
    strike: number;         // Strike price
    timeToExpiry: number;   // Years to expiration
    riskFreeRate: number;   // Annualized risk-free rate
    volatility: number;     // Annualized implied volatility
    dividendYield?: number; // Continuous dividend yield
}

export interface OptionGreeks {
    price: number;
    delta: number;
    gamma: number;
    theta: number;    // Per day
    vega: number;     // Per 1% vol change
    rho: number;      // Per 1% rate change
    lambda: number;   // Leverage ratio (omega)
}

export interface VolSurfacePoint {
    strike: number;
    expiry: number;  // Years
    iv: number;
}

export interface StrategyLeg {
    type: 'call' | 'put';
    strike: number;
    quantity: number;  // +1 for long, -1 for short
    premium: number;   // Price paid/received per contract
}

// ─── Normal Distribution CDF ────────────────────────────────────
// Abramowitz & Stegun approximation (|error| < 7.5e-8)
function normCDF(x: number): number {
    if (x > 10) return 1;
    if (x < -10) return 0;

    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = x < 0 ? -1 : 1;
    x = Math.abs(x);
    const t = 1.0 / (1.0 + p * x);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x / 2);

    return 0.5 * (1.0 + sign * y);
}

function normPDF(x: number): number {
    return Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);
}

// ─── Black-Scholes Core ─────────────────────────────────────────

/**
 * Compute d1 and d2 parameters.
 */
function d1d2(S: number, K: number, T: number, r: number, sigma: number, q: number = 0): [number, number] {
    const d1 = (Math.log(S / K) + (r - q + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
    const d2 = d1 - sigma * Math.sqrt(T);
    return [d1, d2];
}

/**
 * Black-Scholes option price.
 */
export function blackScholes(option: OptionSpec): number {
    const { type, spot: S, strike: K, timeToExpiry: T, riskFreeRate: r, volatility: sigma, dividendYield: q = 0 } = option;

    if (T <= 0) return Math.max(type === 'call' ? S - K : K - S, 0); // At expiry

    const [d1, d2] = d1d2(S, K, T, r, sigma, q);

    if (type === 'call') {
        return S * Math.exp(-q * T) * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    } else {
        return K * Math.exp(-r * T) * normCDF(-d2) - S * Math.exp(-q * T) * normCDF(-d1);
    }
}

/**
 * Full Greeks chain.
 */
export function greeks(option: OptionSpec): OptionGreeks {
    const { type, spot: S, strike: K, timeToExpiry: T, riskFreeRate: r, volatility: sigma, dividendYield: q = 0 } = option;
    const price = blackScholes(option);

    if (T <= 0) {
        const intrinsic = Math.max(type === 'call' ? S - K : K - S, 0);
        return { price: intrinsic, delta: type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0), gamma: 0, theta: 0, vega: 0, rho: 0, lambda: 0 };
    }

    const [d1, d2] = d1d2(S, K, T, r, sigma, q);
    const sqrtT = Math.sqrt(T);
    const nd1 = normPDF(d1);
    const Nd1 = normCDF(d1);
    const Nd2 = normCDF(d2);
    const expQT = Math.exp(-q * T);
    const expRT = Math.exp(-r * T);

    let delta: number;
    let theta: number;
    let rho: number;

    if (type === 'call') {
        delta = expQT * Nd1;
        theta = (-S * expQT * nd1 * sigma / (2 * sqrtT)
            - r * K * expRT * Nd2
            + q * S * expQT * Nd1) / 365; // Per calendar day
        rho = K * T * expRT * Nd2 / 100; // Per 1%
    } else {
        delta = expQT * (Nd1 - 1);
        theta = (-S * expQT * nd1 * sigma / (2 * sqrtT)
            + r * K * expRT * normCDF(-d2)
            - q * S * expQT * normCDF(-d1)) / 365;
        rho = -K * T * expRT * normCDF(-d2) / 100;
    }

    const gamma = expQT * nd1 / (S * sigma * sqrtT);
    const vega = S * expQT * nd1 * sqrtT / 100; // Per 1% vol change

    // Lambda (leverage/omega)
    const lambda = price > 0 ? delta * S / price : 0;

    return { price, delta, gamma, theta, vega, rho, lambda };
}

/**
 * Implied Volatility solver using Brent's method.
 * Finds sigma such that BS(sigma) = marketPrice.
 */
export function impliedVolatility(
    option: Omit<OptionSpec, 'volatility'>,
    marketPrice: number,
    tolerance = 1e-8,
    maxIter = 100
): number {
    // Brent's method bounds
    let a = 0.001;  // 0.1% vol
    let b = 5.0;    // 500% vol

    let fa = blackScholes({ ...option, volatility: a }) - marketPrice;
    let fb = blackScholes({ ...option, volatility: b }) - marketPrice;

    if (fa * fb > 0) {
        // Fallback to bisection with wider bounds
        a = 0.0001; b = 10.0;
        fa = blackScholes({ ...option, volatility: a }) - marketPrice;
        fb = blackScholes({ ...option, volatility: b }) - marketPrice;
        if (fa * fb > 0) return NaN; // No solution
    }

    let c = a, d = b, fc = fa;
    let mflag = true;

    for (let iter = 0; iter < maxIter; iter++) {
        if (Math.abs(fb) < tolerance) return b;
        if (Math.abs(fa) < tolerance) return a;
        if (Math.abs(b - a) < tolerance) return b;

        let s: number;
        if (fa !== fc && fb !== fc) {
            // Inverse quadratic interpolation
            s = a * fb * fc / ((fa - fb) * (fa - fc))
                + b * fa * fc / ((fb - fa) * (fb - fc))
                + c * fa * fb / ((fc - fa) * (fc - fb));
        } else {
            // Secant method
            s = b - fb * (b - a) / (fb - fa);
        }

        // Check conditions for bisection
        const cond1 = s < (3 * a + b) / 4 || s > b;
        const cond2 = mflag && Math.abs(s - b) >= Math.abs(b - c) / 2;
        const cond3 = !mflag && Math.abs(s - b) >= Math.abs(c - d) / 2;
        const cond4 = mflag && Math.abs(b - c) < tolerance;
        const cond5 = !mflag && Math.abs(c - d) < tolerance;

        if (cond1 || cond2 || cond3 || cond4 || cond5) {
            s = (a + b) / 2;
            mflag = true;
        } else {
            mflag = false;
        }

        const fs = blackScholes({ ...option, volatility: s }) - marketPrice;
        d = c; c = b; fc = fb;

        if (fa * fs < 0) { b = s; fb = fs; }
        else { a = s; fa = fs; }

        if (Math.abs(fa) < Math.abs(fb)) {
            [a, b] = [b, a];
            [fa, fb] = [fb, fa];
        }
    }

    return b;
}

/**
 * Put-Call Parity check: C - P = S*e^(-qT) - K*e^(-rT)
 */
export function putCallParity(
    callPrice: number, putPrice: number, spot: number, strike: number,
    T: number, r: number, q: number = 0
): { parityHolds: boolean; deviation: number } {
    const theoretical = spot * Math.exp(-q * T) - strike * Math.exp(-r * T);
    const actual = callPrice - putPrice;
    const deviation = actual - theoretical;
    return { parityHolds: Math.abs(deviation) < 0.01, deviation };
}

/**
 * Strategy P&L computation across a price range.
 */
export function strategyPayoff(legs: StrategyLeg[], priceRange: number[]): { price: number; pnl: number }[] {
    const netPremium = legs.reduce((s, leg) => s + leg.quantity * leg.premium, 0);

    return priceRange.map(price => {
        let payoff = 0;
        for (const leg of legs) {
            const intrinsic = leg.type === 'call'
                ? Math.max(price - leg.strike, 0)
                : Math.max(leg.strike - price, 0);
            payoff += leg.quantity * intrinsic;
        }
        return { price, pnl: payoff - netPremium };
    });
}

/**
 * Generate a simplified volatility surface for display.
 */
export function generateVolSurface(
    atm: number,
    spotPrice: number,
    skewStrength: number = 0.15,
    termStructureSlope: number = 0.02
): VolSurfacePoint[] {
    const strikes = [];
    for (let pct = 0.8; pct <= 1.2; pct += 0.025) {
        strikes.push(spotPrice * pct);
    }
    const expiries = [0.0833, 0.25, 0.5, 1.0, 2.0]; // 1M, 3M, 6M, 1Y, 2Y

    const points: VolSurfacePoint[] = [];
    for (const expiry of expiries) {
        for (const strike of strikes) {
            const moneyness = Math.log(strike / spotPrice);
            // Skew: OTM puts have higher IV
            const skew = -skewStrength * moneyness;
            // Term structure: longer dates slightly higher
            const term = termStructureSlope * Math.sqrt(expiry);
            // Smile curvature
            const smile = 0.05 * moneyness * moneyness;

            const iv = Math.max(atm + skew + term + smile, 0.05);
            points.push({ strike, expiry, iv });
        }
    }
    return points;
}
