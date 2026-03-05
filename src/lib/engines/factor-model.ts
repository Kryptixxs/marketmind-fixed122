/**
 * VANTAGE TERMINAL — Factor Model & Attribution Engine
 * 
 * Portfolio analytics engine implementing:
 * - Fama-French 3-Factor Model (Market, SMB, HML)
 * - Carhart 4-Factor Model (+ Momentum)
 * - Factor decomposition and alpha estimation
 * - Beta decomposition
 * - Risk contribution by factor
 * - Tracking error computation
 * - Information ratio
 * - Sector attribution (Brinson-Hood-Beebower)
 */

// ─── Type Definitions ───────────────────────────────────────────
export interface FactorExposure {
    factor: string;
    beta: number;      // Factor loading
    tStat: number;     // Statistical significance
    contribution: number; // % of return explained
}

export interface FactorModelResult {
    alpha: number;         // Annualized alpha
    alphaAnnualized: number;
    alphaTStat: number;
    rSquared: number;
    adjustedRSquared: number;
    factors: FactorExposure[];
    residualVol: number;   // Idiosyncratic risk
    trackingError: number;
    informationRatio: number;
}

export interface AttributionResult {
    sector: string;
    portfolioWeight: number;
    benchmarkWeight: number;
    portfolioReturn: number;
    benchmarkReturn: number;
    allocationEffect: number;
    selectionEffect: number;
    interactionEffect: number;
    totalEffect: number;
}

// ─── Regression Engine ──────────────────────────────────────────

/**
 * Ordinary Least Squares regression.
 * Y = Xβ + ε
 * β = (X'X)^(-1) X'Y
 */
function olsRegression(Y: number[], X: number[][]): {
    coefficients: number[];
    residuals: number[];
    rSquared: number;
    adjustedRSquared: number;
    standardErrors: number[];
    tStats: number[];
} {
    const n = Y.length;
    const k = X[0].length; // Number of factors + intercept

    // Compute X'X
    const XtX: number[][] = Array(k).fill(null).map(() => Array(k).fill(0));
    const XtY: number[] = Array(k).fill(0);

    for (let i = 0; i < n; i++) {
        for (let j = 0; j < k; j++) {
            XtY[j] += X[i][j] * Y[i];
            for (let m = 0; m < k; m++) {
                XtX[j][m] += X[i][j] * X[i][m];
            }
        }
    }

    // Invert X'X using Gauss-Jordan
    const inv = invertMatrix(XtX);
    if (!inv) return { coefficients: Array(k).fill(0), residuals: Y, rSquared: 0, adjustedRSquared: 0, standardErrors: Array(k).fill(Infinity), tStats: Array(k).fill(0) };

    // β = (X'X)^(-1) X'Y
    const coefficients = inv.map(row => row.reduce((s, val, j) => s + val * XtY[j], 0));

    // Residuals
    const residuals = Y.map((y, i) => y - X[i].reduce((s, x, j) => s + x * coefficients[j], 0));

    // R²
    const yMean = Y.reduce((s, y) => s + y, 0) / n;
    const ssTot = Y.reduce((s, y) => s + (y - yMean) ** 2, 0);
    const ssRes = residuals.reduce((s, r) => s + r * r, 0);
    const rSquared = 1 - ssRes / ssTot;
    const adjustedRSquared = 1 - (1 - rSquared) * (n - 1) / (n - k);

    // Standard errors
    const mse = ssRes / (n - k);
    const standardErrors = inv.map((row, j) => Math.sqrt(Math.max(mse * row[j], 0)));
    const tStats = coefficients.map((c, j) => standardErrors[j] > 0 ? c / standardErrors[j] : 0);

    return { coefficients, residuals, rSquared, adjustedRSquared, standardErrors, tStats };
}

/**
 * Matrix inversion using Gauss-Jordan elimination.
 */
function invertMatrix(matrix: number[][]): number[][] | null {
    const n = matrix.length;
    const augmented = matrix.map((row, i) => {
        const identityRow = Array(n).fill(0);
        identityRow[i] = 1;
        return [...row, ...identityRow];
    });

    for (let col = 0; col < n; col++) {
        // Find pivot
        let maxRow = col;
        for (let row = col + 1; row < n; row++) {
            if (Math.abs(augmented[row][col]) > Math.abs(augmented[maxRow][col])) maxRow = row;
        }
        [augmented[col], augmented[maxRow]] = [augmented[maxRow], augmented[col]];

        if (Math.abs(augmented[col][col]) < 1e-12) return null; // Singular

        const pivot = augmented[col][col];
        for (let j = 0; j < 2 * n; j++) augmented[col][j] /= pivot;

        for (let row = 0; row < n; row++) {
            if (row === col) continue;
            const factor = augmented[row][col];
            for (let j = 0; j < 2 * n; j++) augmented[row][j] -= factor * augmented[col][j];
        }
    }

    return augmented.map(row => row.slice(n));
}

// ─── Factor Model Engine ────────────────────────────────────────

/**
 * Run Fama-French 3-Factor analysis.
 * R_p - R_f = α + β₁(R_m - R_f) + β₂(SMB) + β₃(HML) + ε
 */
export function famaFrench3Factor(
    portfolioReturns: number[],  // Excess returns (Rp - Rf)
    marketReturns: number[],     // Market excess returns (Rm - Rf)
    smbReturns: number[],        // Small minus Big
    hmlReturns: number[],        // High minus Low (value)
): FactorModelResult {
    const n = portfolioReturns.length;

    // Build X matrix: [1, MktRf, SMB, HML]
    const X = portfolioReturns.map((_, i) => [1, marketReturns[i], smbReturns[i], hmlReturns[i]]);

    const result = olsRegression(portfolioReturns, X);
    const [alpha, betaMkt, betaSMB, betaHML] = result.coefficients;

    // Annualize (assuming monthly data)
    const periodsPerYear = 12;
    const alphaAnnualized = alpha * periodsPerYear;

    // Residual volatility (idiosyncratic risk)
    const residualVol = Math.sqrt(result.residuals.reduce((s, r) => s + r * r, 0) / (n - 4)) * Math.sqrt(periodsPerYear);

    // Tracking error (std dev of residuals annualized)
    const meanRes = result.residuals.reduce((s, r) => s + r, 0) / n;
    const trackingError = Math.sqrt(result.residuals.reduce((s, r) => s + (r - meanRes) ** 2, 0) / (n - 1)) * Math.sqrt(periodsPerYear);

    // Information ratio
    const informationRatio = trackingError > 0 ? alphaAnnualized / trackingError : 0;

    // Factor contributions
    const mktContrib = betaMkt * (marketReturns.reduce((s, r) => s + r, 0) / n) * periodsPerYear;
    const smbContrib = betaSMB * (smbReturns.reduce((s, r) => s + r, 0) / n) * periodsPerYear;
    const hmlContrib = betaHML * (hmlReturns.reduce((s, r) => s + r, 0) / n) * periodsPerYear;

    return {
        alpha,
        alphaAnnualized,
        alphaTStat: result.tStats[0],
        rSquared: result.rSquared,
        adjustedRSquared: result.adjustedRSquared,
        factors: [
            { factor: 'Market (Rm-Rf)', beta: betaMkt, tStat: result.tStats[1], contribution: mktContrib },
            { factor: 'SMB (Size)', beta: betaSMB, tStat: result.tStats[2], contribution: smbContrib },
            { factor: 'HML (Value)', beta: betaHML, tStat: result.tStats[3], contribution: hmlContrib },
        ],
        residualVol,
        trackingError,
        informationRatio,
    };
}

/**
 * Carhart 4-Factor Model (adds Momentum).
 */
export function carhart4Factor(
    portfolioReturns: number[],
    marketReturns: number[],
    smbReturns: number[],
    hmlReturns: number[],
    momReturns: number[], // Winners minus Losers
): FactorModelResult {
    const n = portfolioReturns.length;
    const X = portfolioReturns.map((_, i) => [1, marketReturns[i], smbReturns[i], hmlReturns[i], momReturns[i]]);
    const result = olsRegression(portfolioReturns, X);
    const [alpha, betaMkt, betaSMB, betaHML, betaMOM] = result.coefficients;

    const periodsPerYear = 12;
    const alphaAnnualized = alpha * periodsPerYear;

    const residualVol = Math.sqrt(result.residuals.reduce((s, r) => s + r * r, 0) / (n - 5)) * Math.sqrt(periodsPerYear);
    const meanRes = result.residuals.reduce((s, r) => s + r, 0) / n;
    const trackingError = Math.sqrt(result.residuals.reduce((s, r) => s + (r - meanRes) ** 2, 0) / (n - 1)) * Math.sqrt(periodsPerYear);
    const informationRatio = trackingError > 0 ? alphaAnnualized / trackingError : 0;

    return {
        alpha, alphaAnnualized,
        alphaTStat: result.tStats[0],
        rSquared: result.rSquared,
        adjustedRSquared: result.adjustedRSquared,
        factors: [
            { factor: 'Market (Rm-Rf)', beta: betaMkt, tStat: result.tStats[1], contribution: 0 },
            { factor: 'SMB (Size)', beta: betaSMB, tStat: result.tStats[2], contribution: 0 },
            { factor: 'HML (Value)', beta: betaHML, tStat: result.tStats[3], contribution: 0 },
            { factor: 'MOM (Momentum)', beta: betaMOM, tStat: result.tStats[4], contribution: 0 },
        ],
        residualVol, trackingError, informationRatio,
    };
}

// ─── Brinson-Hood-Beebower Attribution ──────────────────────────

/**
 * Sector-level performance attribution.
 * Allocation Effect = (wp - wb)(Rb - RB)
 * Selection Effect = wb(Rp - Rb)  
 * Interaction Effect = (wp - wb)(Rp - Rb)
 */
export function brinsonAttribution(
    sectors: {
        name: string;
        portfolioWeight: number;
        benchmarkWeight: number;
        portfolioReturn: number;
        benchmarkReturn: number;
    }[],
): AttributionResult[] {
    const totalBenchmarkReturn = sectors.reduce((s, sec) => s + sec.benchmarkWeight * sec.benchmarkReturn, 0);

    return sectors.map(sec => {
        const wp = sec.portfolioWeight;
        const wb = sec.benchmarkWeight;
        const rp = sec.portfolioReturn;
        const rb = sec.benchmarkReturn;
        const RB = totalBenchmarkReturn;

        const allocationEffect = (wp - wb) * (rb - RB);
        const selectionEffect = wb * (rp - rb);
        const interactionEffect = (wp - wb) * (rp - rb);
        const totalEffect = allocationEffect + selectionEffect + interactionEffect;

        return {
            sector: sec.name,
            portfolioWeight: wp,
            benchmarkWeight: wb,
            portfolioReturn: rp,
            benchmarkReturn: rb,
            allocationEffect,
            selectionEffect,
            interactionEffect,
            totalEffect,
        };
    });
}
