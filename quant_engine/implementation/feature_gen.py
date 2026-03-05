import numpy as np
import pandas as pd
from typing import List, Tuple
from quant_engine.interfaces.base import IFeatureGenerator

class FractionalDiffGen(IFeatureGenerator):
    """
    Computes fractionally differenced series to retain long-memory while achieving stationarity.
    Uses an expanding window or fixed window length strictly without lookahead bias.
    Formula: (1-L)^d X_t = sum_{k=0}^infty (-1)^k binom(d,k) X_{t-k}
    """
    def __init__(self, d: float, thres: float = 1e-4):
        self.d = d
        self.thres = thres
        self.weights = self._get_weights()
    
    def _get_weights(self) -> np.ndarray:
        w = [1.0]
        k = 1
        while abs(w[-1]) > self.thres:
            w.append(-w[-1] / k * (self.d - k + 1))
            k += 1
        w = np.array(w[::-1]).reshape(-1, 1)
        return w
        
    def generate(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Applies fractional differencing strictly to close prices.
        """
        if 'close' not in data.columns:
            raise ValueError("Data must contain 'close' column.")
            
        series = data['close'].values.reshape(-1, 1)
        weights_len = len(self.weights)
        
        # We need at least weights_len points to output valid data
        out = pd.Series(index=data.index, dtype=float)
        
        # strictly causal application using dot product over rolling windows
        for i in range(weights_len, len(series) + 1):
            window = series[i - weights_len:i]
            out.iloc[i - 1] = np.dot(self.weights.T, window)[0, 0]
            
        return pd.DataFrame({'frac_diff_close': out})

class VolatilityFeatureGen(IFeatureGenerator):
    """
    Computes various high-frequency volatility estimators strictly looking backward.
    """
    def __init__(self, lookback_periods: List[int]):
        self.lookbacks = lookback_periods
        
    def generate(self, data: pd.DataFrame) -> pd.DataFrame:
        features = pd.DataFrame(index=data.index)
        
        for lb in self.lookbacks:
            # Parkinson Volatility (using High/Low only)
            # Vol = sqrt( (1 / (4 * n * ln(2))) * sum(ln(H/L)^2) )
            hl_ratio = np.log(data['high'] / data['low']) ** 2
            
            # Using expanding or strictly backward rolling sum to avoid future leakage
            parkinson_vol = np.sqrt((1.0 / (4.0 * np.log(2.0) * lb)) * hl_ratio.rolling(window=lb).sum())
            features[f'parkinson_vol_{lb}'] = parkinson_vol
            
            # Garman-Klass Volatility (includes Open/Close)
            # Vol = sqrt( 1/n * sum( 0.5*ln(H/L)^2 - (2*ln(2)-1)*ln(C/O)^2 ) )
            co_ratio = np.log(data['close'] / data['open']) ** 2
            gk_var = 0.5 * hl_ratio - (2.0 * np.log(2.0) - 1.0) * co_ratio
            gk_vol = np.sqrt((1.0 / lb) * gk_var.rolling(window=lb).sum())
            features[f'garman_klass_vol_{lb}'] = gk_vol
            
        return features

class CompositeFeatureGen(IFeatureGenerator):
    """
    Pipelines multiple feature generators.
    """
    def __init__(self, generators: List[IFeatureGenerator]):
        self.generators = generators
        
    def generate(self, data: pd.DataFrame) -> pd.DataFrame:
        dfs = []
        for gen in self.generators:
            feat = gen.generate(data)
            dfs.append(feat)
        return pd.concat(dfs, axis=1)
