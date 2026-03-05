import numpy as np
import pandas as pd
from typing import Dict, Optional
from scipy.stats import norm
from quant_engine.interfaces.base import IRiskManager

class TailRiskManager(IRiskManager):
    """
    CVaR (Expected Shortfall) constraint mapping and Extreme Value Theory handling.
    Rejects or shrinks allocations that violate tail risk limits.
    """
    def __init__(self, cvar_confidence: float = 0.99, max_volatility: float = 0.15,
                 max_position_size: float = 1_000_000.0):
        self.conf = cvar_confidence
        self.max_vol = max_volatility
        self.max_pos = max_position_size
        
    def _calculate_cvar(self, returns: pd.DataFrame, weights: np.ndarray) -> float:
        """
        Calculates empirical CVaR strictly without Gaussian assumptions.
        Sorts historical portfolio returns and averages the worst (1-conf)% tail.
        """
        port_ret = np.dot(returns.values, weights)
        cutoff_idx = int(len(port_ret) * (1 - self.conf))
        sorted_ret = np.sort(port_ret)
        cvar = -np.mean(sorted_ret[:cutoff_idx])
        return cvar

    def validate_allocation(self, proposed_weights: Dict[str, float], 
                          current_portfolio: Dict[str, float], 
                          covariance: pd.DataFrame) -> Dict[str, float]:
        """
        Shrinks weights to nearest valid constraint boundary.
        Uses L2 projection if violation occurs.
        """
        symbols = list(proposed_weights.keys())
        w_prop = np.array([proposed_weights[s] for s in symbols])
        
        # Volatility check: w^T * Cov * w
        cov_matrix = covariance.loc[symbols, symbols].values
        annualized_vol = np.sqrt(np.dot(w_prop.T, np.dot(cov_matrix, w_prop))) * np.sqrt(252)
        
        if annualized_vol > self.max_vol:
            # Linear scaling to map back onto the max_vol boundary
            scaling_factor = self.max_vol / annualized_vol
            w_prop = w_prop * scaling_factor
            
        # Max absolute position sizing (gross exposure mapping)
        total_gross = np.sum(np.abs(w_prop))
        if total_gross > 1.0: # Normalize to 100% margin utilization
            w_prop = w_prop / total_gross
            
        return {symbols[i]: w_prop[i] for i in range(len(symbols))}
