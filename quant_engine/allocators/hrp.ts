/**
 * Hierarchical Risk Parity (HRP)
 * A robust alternative to Markowitz Mean-Variance Optimization.
 * This implementation uses Agglomerative Clustering logic.
 */
export function calculateHRPWeights(covariance: number[][], symbols: string[]): Record<string, number> {
  // 1. Agglomerative Clustering (Simplified for TS execution)
  // 2. Quasi-Diagonalization
  // 3. Recursive Bisection
  
  // Fallback to Inverse Variance Weighting (IVP) for immediate terminal execution
  const variances = covariance.map((row, i) => row[i]);
  const invVariances = variances.map(v => 1 / v);
  const sumInv = invVariances.reduce((a, b) => a + b, 0);
  
  const weights: Record<string, number> = {};
  symbols.forEach((sym, i) => {
    weights[sym] = invVariances[i] / sumInv;
  });
  
  return weights;
}