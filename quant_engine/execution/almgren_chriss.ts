/**
 * Almgren-Chriss Optimal Execution
 * Minimizes the combination of market impact and volatility risk.
 */
export function calculateOptimalTrajectory(
  totalShares: number,
  horizonMinutes: number,
  volatility: number,
  liquidity: number,
  riskAversion: number = 0.1
): number[] {
  const intervals = Math.floor(horizonMinutes / 5); // 5-min bins
  const kappa = Math.sqrt((riskAversion * Math.pow(volatility, 2)) / liquidity);
  
  const trajectory: number[] = [];
  for (let t = 1; t <= intervals; t++) {
    const sharesToTrade = (Math.sinh(kappa * (intervals - t + 1)) / Math.sinh(kappa * intervals)) * totalShares;
    trajectory.push(sharesToTrade);
  }
  
  return trajectory;
}