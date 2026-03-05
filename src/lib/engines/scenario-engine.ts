/**
 * VANTAGE TERMINAL — Scenario & Stress Testing Engine
 * 
 * Risk analytics engine implementing:
 * - Historical VaR (parametric, historical simulation, Monte Carlo)
 * - Stress test scenarios (predefined + custom)
 * - Monte Carlo portfolio simulation
 * - Sensitivity analysis (factor shocks)
 * - Drawdown analysis
 */

// ─── Type Definitions ───────────────────────────────────────────
export interface PortfolioPosition {
    symbol: string;
    weight: number;        // Portfolio weight (0-1)
    currentPrice: number;
    expectedReturn: number; // Annualized
    volatility: number;     // Annualized
}

export interface VaRResult {
    var95: number;     // 95% VaR (loss amount)
    var99: number;     // 99% VaR
    cvar95: number;    // Conditional VaR (Expected Shortfall) at 95%
    cvar99: number;
    method: string;
}

export interface StressScenario {
    name: string;
    description: string;
    shocks: Record<string, number>;  // factor -> shock magnitude (e.g., 'equity' -> -0.40)
    historicalDate?: string;
}

export interface ScenarioResult {
    scenario: string;
    portfolioReturn: number;
    portfolioLoss: number;
    worstPosition: { symbol: string; loss: number };
    bestPosition: { symbol: string; gain: number };
}

export interface MonteCarloResult {
    expectedReturn: number;
    medianReturn: number;
    percentile5: number;
    percentile95: number;
    maxDrawdown: number;
    sharpeRatio: number;
    paths: number[][];  // Subset of simulated paths for visualization
}

// ─── Statistical Utilities ──────────────────────────────────────

/** Box-Muller transform for normal random numbers. */
function normalRandom(): number {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

/** Generate correlated random numbers using Cholesky decomposition. */
function choleskyDecompose(matrix: number[][]): number[][] | null {
    const n = matrix.length;
    const L: number[][] = Array(n).fill(null).map(() => Array(n).fill(0));

    for (let i = 0; i < n; i++) {
        for (let j = 0; j <= i; j++) {
            let sum = 0;
            for (let k = 0; k < j; k++) {
                sum += L[i][k] * L[j][k];
            }
            if (i === j) {
                const val = matrix[i][i] - sum;
                if (val < 0) return null; // Not positive definite
                L[i][j] = Math.sqrt(val);
            } else {
                L[i][j] = L[j][j] !== 0 ? (matrix[i][j] - sum) / L[j][j] : 0;
            }
        }
    }
    return L;
}

function percentile(sorted: number[], p: number): number {
    const idx = (p / 100) * (sorted.length - 1);
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (idx - lower);
}

// ─── VaR Calculations ───────────────────────────────────────────

/**
 * Parametric VaR (variance-covariance method).
 * Assumes returns are normally distributed.
 */
export function parametricVaR(
    portfolioValue: number,
    weightedReturn: number,
    portfolioVol: number,
    holdingDays: number = 1
): VaRResult {
    const sqrtT = Math.sqrt(holdingDays / 252);
    const dailyVol = portfolioVol * sqrtT;

    const var95 = portfolioValue * (weightedReturn * holdingDays / 252 - 1.645 * dailyVol);
    const var99 = portfolioValue * (weightedReturn * holdingDays / 252 - 2.326 * dailyVol);

    // CVaR for normal distribution: CVaR = μ - σ * φ(z) / (1-α)
    const phi95 = Math.exp(-1.645 * 1.645 / 2) / Math.sqrt(2 * Math.PI);
    const cvar95 = portfolioValue * (weightedReturn * holdingDays / 252 - dailyVol * phi95 / 0.05);
    const phi99 = Math.exp(-2.326 * 2.326 / 2) / Math.sqrt(2 * Math.PI);
    const cvar99 = portfolioValue * (weightedReturn * holdingDays / 252 - dailyVol * phi99 / 0.01);

    return {
        var95: Math.abs(var95),
        var99: Math.abs(var99),
        cvar95: Math.abs(cvar95),
        cvar99: Math.abs(cvar99),
        method: 'Parametric (Normal)',
    };
}

/**
 * Historical simulation VaR from return series.
 */
export function historicalVaR(
    returns: number[],
    portfolioValue: number,
): VaRResult {
    const sorted = [...returns].sort((a, b) => a - b);
    const n = sorted.length;

    const var95Val = percentile(sorted, 5);
    const var99Val = percentile(sorted, 1);

    // CVaR = average of returns beyond VaR threshold
    const tail95 = sorted.slice(0, Math.max(1, Math.floor(n * 0.05)));
    const cvar95Val = tail95.reduce((s, r) => s + r, 0) / tail95.length;
    const tail99 = sorted.slice(0, Math.max(1, Math.floor(n * 0.01)));
    const cvar99Val = tail99.reduce((s, r) => s + r, 0) / tail99.length;

    return {
        var95: Math.abs(var95Val * portfolioValue),
        var99: Math.abs(var99Val * portfolioValue),
        cvar95: Math.abs(cvar95Val * portfolioValue),
        cvar99: Math.abs(cvar99Val * portfolioValue),
        method: 'Historical Simulation',
    };
}

// ─── Monte Carlo Simulation ─────────────────────────────────────

/**
 * Monte Carlo portfolio simulation.
 * Generates correlated return paths for a portfolio of assets.
 */
export function monteCarloSimulation(
    positions: PortfolioPosition[],
    correlationMatrix: number[][],
    horizonDays: number = 252,
    numSimulations: number = 5000,
    portfolioValue: number = 1000000,
): MonteCarloResult {
    const n = positions.length;
    const dt = 1 / 252; // Daily time step

    // Cholesky decomposition for correlated random numbers
    const L = choleskyDecompose(correlationMatrix);
    if (!L) {
        // Fallback to uncorrelated simulation
        return uncorrelatedMonteCarlo(positions, horizonDays, numSimulations, portfolioValue);
    }

    const finalReturns: number[] = [];
    const maxDrawdowns: number[] = [];
    const storedPaths: number[][] = []; // Store first 50 paths for visualization

    for (let sim = 0; sim < numSimulations; sim++) {
        let portfolioPathValue = portfolioValue;
        let peak = portfolioValue;
        let maxDd = 0;
        const pathValues: number[] = [portfolioValue];

        for (let day = 0; day < horizonDays; day++) {
            // Generate correlated random numbers
            const z = Array(n).fill(null).map(() => normalRandom());
            const correlatedZ = Array(n).fill(0);
            for (let i = 0; i < n; i++) {
                for (let j = 0; j <= i; j++) {
                    correlatedZ[i] += L[i][j] * z[j];
                }
            }

            // Apply returns to each position
            let dailyReturn = 0;
            for (let i = 0; i < n; i++) {
                const mu = positions[i].expectedReturn * dt;
                const sigma = positions[i].volatility * Math.sqrt(dt);
                const assetReturn = mu + sigma * correlatedZ[i];
                dailyReturn += positions[i].weight * assetReturn;
            }

            portfolioPathValue *= (1 + dailyReturn);
            if (portfolioPathValue > peak) peak = portfolioPathValue;
            const dd = (peak - portfolioPathValue) / peak;
            if (dd > maxDd) maxDd = dd;
            pathValues.push(portfolioPathValue);
        }

        finalReturns.push((portfolioPathValue - portfolioValue) / portfolioValue);
        maxDrawdowns.push(maxDd);
        if (storedPaths.length < 50) storedPaths.push(pathValues);
    }

    finalReturns.sort((a, b) => a - b);

    const expectedReturn = finalReturns.reduce((s, r) => s + r, 0) / numSimulations;
    const medianReturn = percentile(finalReturns, 50);
    const percentile5 = percentile(finalReturns, 5);
    const percentile95 = percentile(finalReturns, 95);
    const maxDrawdown = Math.max(...maxDrawdowns);
    const volatility = Math.sqrt(finalReturns.reduce((s, r) => s + (r - expectedReturn) ** 2, 0) / (numSimulations - 1));
    const sharpeRatio = volatility > 0 ? expectedReturn / volatility : 0;

    return { expectedReturn, medianReturn, percentile5, percentile95, maxDrawdown, sharpeRatio, paths: storedPaths };
}

function uncorrelatedMonteCarlo(positions: PortfolioPosition[], horizonDays: number, numSims: number, pv: number): MonteCarloResult {
    const identity = positions.map((_, i) => positions.map((_, j) => i === j ? 1 : 0));
    // Recursion guard: just run simplified
    const finalReturns: number[] = [];
    for (let sim = 0; sim < numSims; sim++) {
        let val = pv;
        for (let day = 0; day < horizonDays; day++) {
            let dr = 0;
            for (const pos of positions) {
                dr += pos.weight * (pos.expectedReturn / 252 + pos.volatility / Math.sqrt(252) * normalRandom());
            }
            val *= (1 + dr);
        }
        finalReturns.push((val - pv) / pv);
    }
    finalReturns.sort((a, b) => a - b);
    const mean = finalReturns.reduce((s, r) => s + r, 0) / numSims;
    return { expectedReturn: mean, medianReturn: percentile(finalReturns, 50), percentile5: percentile(finalReturns, 5), percentile95: percentile(finalReturns, 95), maxDrawdown: 0, sharpeRatio: 0, paths: [] };
}

// ─── Predefined Stress Scenarios ────────────────────────────────

export const STRESS_SCENARIOS: StressScenario[] = [
    {
        name: '2008 Global Financial Crisis',
        description: 'Lehman collapse, credit freeze, equity selloff',
        shocks: { equity: -0.55, credit: -0.20, rates: -0.015, commodities: -0.50, fx_usd: 0.15, vol: 0.80 },
        historicalDate: '2008-09-15',
    },
    {
        name: '2020 COVID Crash',
        description: 'Pandemic lockdown, liquidity crisis, V-shaped recovery',
        shocks: { equity: -0.34, credit: -0.15, rates: -0.015, commodities: -0.65, fx_usd: 0.05, vol: 0.65 },
        historicalDate: '2020-03-23',
    },
    {
        name: 'Rate Shock (+200bps)',
        description: 'Aggressive tightening cycle',
        shocks: { equity: -0.15, credit: -0.08, rates: 0.02, commodities: -0.10, fx_usd: 0.08, vol: 0.25 },
    },
    {
        name: 'Inflation Spike',
        description: 'Stagflation scenario with persistent inflation',
        shocks: { equity: -0.20, credit: -0.12, rates: 0.015, commodities: 0.30, fx_usd: -0.05, vol: 0.30 },
    },
    {
        name: 'USD Collapse',
        description: 'Loss of reserve currency confidence',
        shocks: { equity: -0.10, credit: -0.05, rates: 0.01, commodities: 0.40, fx_usd: -0.25, vol: 0.45 },
    },
    {
        name: 'Geopolitical Crisis',
        description: 'Major geopolitical event / conflict escalation',
        shocks: { equity: -0.20, credit: -0.10, rates: -0.005, commodities: 0.25, fx_usd: 0.10, vol: 0.50 },
    },
];

/**
 * Apply stress scenario to portfolio.
 */
export function applyStressScenario(
    positions: PortfolioPosition[],
    scenario: StressScenario,
    factorExposures: Record<string, Record<string, number>>, // symbol -> factor -> exposure
    portfolioValue: number = 1000000,
): ScenarioResult {
    let totalReturn = 0;
    let worstLoss = 0;
    let worstSymbol = '';
    let bestGain = -Infinity;
    let bestSymbol = '';

    for (const pos of positions) {
        const exposures = factorExposures[pos.symbol] || { equity: 1.0 };
        let posReturn = 0;

        for (const [factor, shock] of Object.entries(scenario.shocks)) {
            const exposure = exposures[factor] || 0;
            posReturn += exposure * shock;
        }

        totalReturn += pos.weight * posReturn;

        if (posReturn * pos.weight < worstLoss) {
            worstLoss = posReturn * pos.weight;
            worstSymbol = pos.symbol;
        }
        if (posReturn * pos.weight > bestGain) {
            bestGain = posReturn * pos.weight;
            bestSymbol = pos.symbol;
        }
    }

    return {
        scenario: scenario.name,
        portfolioReturn: totalReturn,
        portfolioLoss: totalReturn * portfolioValue,
        worstPosition: { symbol: worstSymbol, loss: worstLoss * portfolioValue },
        bestPosition: { symbol: bestSymbol, gain: bestGain * portfolioValue },
    };
}
