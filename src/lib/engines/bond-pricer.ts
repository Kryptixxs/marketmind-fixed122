/**
 * VANTAGE TERMINAL — Fixed Income Bond Pricer
 * 
 * Production-grade bond mathematics engine implementing:
 * - Present Value (dirty/clean price)
 * - Yield to Maturity (Newton-Raphson solver)
 * - Macaulay Duration
 * - Modified Duration
 * - Effective Duration
 * - Convexity
 * - Dollar Value of a Basis Point (DV01/BPV)
 * - Z-Spread (iterative solver over benchmark curve)
 * - Accrued Interest (30/360, ACT/ACT, ACT/360)
 * - Current Yield
 * - Spread to Benchmark
 */

// ─── Type Definitions ───────────────────────────────────────────
export interface BondSpec {
    faceValue: number;          // Par value (typically 100 or 1000)
    couponRate: number;         // Annual coupon rate (e.g., 0.05 = 5%)
    frequency: 1 | 2 | 4 | 12; // Payments per year
    maturityYears: number;      // Years to maturity
    settlementDate?: Date;      // Settlement date (defaults to today)
    maturityDate?: Date;        // Maturity date
    dayCountConvention?: '30/360' | 'ACT/ACT' | 'ACT/360';
}

export interface BondAnalytics {
    cleanPrice: number;
    dirtyPrice: number;
    accruedInterest: number;
    ytm: number;
    currentYield: number;
    macaulayDuration: number;
    modifiedDuration: number;
    effectiveDuration: number;
    convexity: number;
    dv01: number;               // Dollar value of 1bp
    spreadToBenchmark: number;
    zSpread: number;
}

// ─── Core Pricing Functions ─────────────────────────────────────

/**
 * Calculate bond dirty price given yield.
 * PV = Σ(C / (1+y/f)^t) + F / (1+y/f)^n
 */
export function bondPrice(bond: BondSpec, yieldRate: number): number {
    const { faceValue, couponRate, frequency, maturityYears } = bond;
    const couponPayment = (couponRate * faceValue) / frequency;
    const periodsTotal = maturityYears * frequency;
    const yieldPerPeriod = yieldRate / frequency;

    let pv = 0;
    for (let t = 1; t <= periodsTotal; t++) {
        pv += couponPayment / Math.pow(1 + yieldPerPeriod, t);
    }
    pv += faceValue / Math.pow(1 + yieldPerPeriod, periodsTotal);

    return pv;
}

/**
 * Yield to Maturity solver using Newton-Raphson method.
 * Finds y such that P(y) = marketPrice.
 */
export function yieldToMaturity(bond: BondSpec, marketPrice: number, tolerance = 1e-10, maxIter = 200): number {
    const { faceValue, couponRate, frequency, maturityYears } = bond;
    const couponPayment = (couponRate * faceValue) / frequency;
    const n = maturityYears * frequency;

    // Initial guess using current yield approximation
    let y = couponRate > 0 ? (couponPayment * frequency) / marketPrice : 0.05;

    for (let iter = 0; iter < maxIter; iter++) {
        const yp = y / frequency;
        let price = 0;
        let dPrice = 0; // derivative dP/dy

        for (let t = 1; t <= n; t++) {
            const df = Math.pow(1 + yp, t);
            price += couponPayment / df;
            dPrice -= (t / frequency) * couponPayment / (df * (1 + yp));
        }
        const dfn = Math.pow(1 + yp, n);
        price += faceValue / dfn;
        dPrice -= (n / frequency) * faceValue / (dfn * (1 + yp));

        const diff = price - marketPrice;
        if (Math.abs(diff) < tolerance) return y;

        y -= diff / dPrice; // Newton step
    }

    return y; // Best approximation after maxIter
}

/**
 * Macaulay Duration — weighted average time to cash flows.
 */
export function macaulayDuration(bond: BondSpec, yieldRate: number): number {
    const { faceValue, couponRate, frequency, maturityYears } = bond;
    const couponPayment = (couponRate * faceValue) / frequency;
    const n = maturityYears * frequency;
    const yp = yieldRate / frequency;
    const price = bondPrice(bond, yieldRate);

    let weightedTime = 0;
    for (let t = 1; t <= n; t++) {
        const timeFraction = t / frequency;
        const pvcf = couponPayment / Math.pow(1 + yp, t);
        weightedTime += timeFraction * pvcf;
    }
    // Final principal
    const timeFraction = n / frequency;
    const pvPrincipal = faceValue / Math.pow(1 + yp, n);
    weightedTime += timeFraction * pvPrincipal;

    return weightedTime / price;
}

/**
 * Modified Duration = Macaulay Duration / (1 + y/f)
 */
export function modifiedDuration(bond: BondSpec, yieldRate: number): number {
    const macDur = macaulayDuration(bond, yieldRate);
    return macDur / (1 + yieldRate / bond.frequency);
}

/**
 * Effective Duration — numerical approximation for bonds with embedded options.
 * EffDur = (P(-Δy) - P(+Δy)) / (2 * P0 * Δy)
 */
export function effectiveDuration(bond: BondSpec, yieldRate: number, shiftBps: number = 1): number {
    const dy = shiftBps / 10000;
    const priceUp = bondPrice(bond, yieldRate - dy);
    const priceDown = bondPrice(bond, yieldRate + dy);
    const priceBase = bondPrice(bond, yieldRate);
    return (priceUp - priceDown) / (2 * priceBase * dy);
}

/**
 * Convexity — second-order interest rate sensitivity.
 * Conv = (1/P) * Σ[t*(t+1) * CFt / (1+y/f)^(t+2)] / f^2
 */
export function convexity(bond: BondSpec, yieldRate: number): number {
    const { faceValue, couponRate, frequency, maturityYears } = bond;
    const couponPayment = (couponRate * faceValue) / frequency;
    const n = maturityYears * frequency;
    const yp = yieldRate / frequency;
    const price = bondPrice(bond, yieldRate);

    let conv = 0;
    for (let t = 1; t <= n; t++) {
        conv += (t * (t + 1) * couponPayment) / Math.pow(1 + yp, t + 2);
    }
    conv += (n * (n + 1) * faceValue) / Math.pow(1 + yp, n + 2);
    conv /= (frequency * frequency * price);

    return conv;
}

/**
 * DV01 (Dollar Value of a Basis Point) — price change for 1bp yield shift.
 */
export function dv01(bond: BondSpec, yieldRate: number): number {
    const modDur = modifiedDuration(bond, yieldRate);
    const price = bondPrice(bond, yieldRate);
    return modDur * price * 0.0001; // 1bp = 0.01%
}

/**
 * Z-Spread solver over a benchmark curve.
 * Finds spread s such that P = Σ[CFt / (1 + rt + s)^t]
 * where rt are benchmark zero rates at each period.
 */
export function zSpread(
    bond: BondSpec,
    marketPrice: number,
    benchmarkZeroRates: number[], // Zero rates for each period
    tolerance = 1e-8,
    maxIter = 100
): number {
    const { faceValue, couponRate, frequency, maturityYears } = bond;
    const couponPayment = (couponRate * faceValue) / frequency;
    const n = maturityYears * frequency;

    let spread = 0.001; // Initial guess: 10bps

    for (let iter = 0; iter < maxIter; iter++) {
        let price = 0;
        let dPrice = 0;

        for (let t = 1; t <= n; t++) {
            const zeroRate = benchmarkZeroRates[Math.min(t - 1, benchmarkZeroRates.length - 1)] / frequency;
            const totalRate = zeroRate + spread / frequency;
            const df = Math.pow(1 + totalRate, t);
            const cf = t === n ? couponPayment + faceValue : couponPayment;
            price += cf / df;
            dPrice -= (t / frequency) * cf / (df * (1 + totalRate));
        }

        const diff = price - marketPrice;
        if (Math.abs(diff) < tolerance) return spread;
        spread -= diff / dPrice;
    }

    return spread;
}

/**
 * Accrued Interest calculation.
 */
export function accruedInterest(
    bond: BondSpec,
    lastCouponDate: Date,
    settlementDate: Date = new Date()
): number {
    const { faceValue, couponRate, frequency, dayCountConvention = '30/360' } = bond;
    const couponPayment = (couponRate * faceValue) / frequency;

    let daysSinceLastCoupon: number;
    let daysInPeriod: number;

    if (dayCountConvention === '30/360') {
        daysSinceLastCoupon = days30_360(lastCouponDate, settlementDate);
        daysInPeriod = 360 / frequency;
    } else if (dayCountConvention === 'ACT/360') {
        daysSinceLastCoupon = actualDays(lastCouponDate, settlementDate);
        daysInPeriod = 360 / frequency;
    } else {
        // ACT/ACT
        daysSinceLastCoupon = actualDays(lastCouponDate, settlementDate);
        const nextCoupon = new Date(lastCouponDate);
        nextCoupon.setMonth(nextCoupon.getMonth() + 12 / frequency);
        daysInPeriod = actualDays(lastCouponDate, nextCoupon);
    }

    return couponPayment * (daysSinceLastCoupon / daysInPeriod);
}

/**
 * Full bond analytics computation.
 */
export function analyzeBond(bond: BondSpec, marketPrice: number, benchmarkYield: number = 0.04): BondAnalytics {
    const ytm = yieldToMaturity(bond, marketPrice);
    const macDur = macaulayDuration(bond, ytm);
    const modDur = modifiedDuration(bond, ytm);
    const effDur = effectiveDuration(bond, ytm);
    const conv = convexity(bond, ytm);
    const dollarDv01 = dv01(bond, ytm);
    const currentYld = (bond.couponRate * bond.faceValue) / marketPrice;

    // Simplified accrued interest (assume mid-period)
    const periodsPerYear = bond.frequency;
    const couponPayment = (bond.couponRate * bond.faceValue) / periodsPerYear;
    const ai = couponPayment * 0.5; // Mid-period estimate

    // Z-spread with flat benchmark curve
    const benchmarkRates = Array(bond.maturityYears * bond.frequency).fill(benchmarkYield);
    const zSpr = zSpread(bond, marketPrice, benchmarkRates);

    return {
        cleanPrice: marketPrice,
        dirtyPrice: marketPrice + ai,
        accruedInterest: ai,
        ytm,
        currentYield: currentYld,
        macaulayDuration: macDur,
        modifiedDuration: modDur,
        effectiveDuration: effDur,
        convexity: conv,
        dv01: dollarDv01,
        spreadToBenchmark: ytm - benchmarkYield,
        zSpread: zSpr,
    };
}

// ─── Day Count Utilities ────────────────────────────────────────
function days30_360(d1: Date, d2: Date): number {
    let y1 = d1.getFullYear(), m1 = d1.getMonth() + 1, day1 = Math.min(d1.getDate(), 30);
    let y2 = d2.getFullYear(), m2 = d2.getMonth() + 1, day2 = Math.min(d2.getDate(), 30);
    if (day1 === 31) day1 = 30;
    if (day2 === 31 && day1 >= 30) day2 = 30;
    return 360 * (y2 - y1) + 30 * (m2 - m1) + (day2 - day1);
}

function actualDays(d1: Date, d2: Date): number {
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
}
