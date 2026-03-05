import numpy as np
import pandas as pd
from typing import List, Dict, Any
from quant_engine.interfaces.base import IFeatureGenerator

class ConfluenceAggregator:
    """
    Aggregates signals from multiple feature generators and models.
    Uses a weighted voting scheme to determine final conviction.
    """
    def __init__(self, weights: Dict[str, float] = None):
        self.weights = weights or {
            'technical': 0.4,
            'sentiment': 0.3,
            'macro': 0.3
        }

    def aggregate_signals(self, 
                         tech_signals: pd.Series, 
                         sent_signals: pd.Series, 
                         macro_signals: pd.Series) -> pd.Series:
        """
        Combines normalized signals [-1, 1] into a single conviction score.
        """
        # Ensure indices are aligned
        common_idx = tech_signals.index.intersection(sent_signals.index).intersection(macro_signals.index)
        
        t = tech_signals.loc[common_idx]
        s = sent_signals.loc[common_idx]
        m = macro_signals.loc[common_idx]
        
        conviction = (
            t * self.weights['technical'] +
            s * self.weights['sentiment'] +
            m * self.weights['macro']
        )
        
        return conviction

class MarketMicrostructureConfluence(IFeatureGenerator):
    """
    Detects institutional footprints using Order Flow and Volume Profile.
    """
    def generate(self, data: pd.DataFrame) -> pd.DataFrame:
        df = pd.DataFrame(index=data.index)
        
        # 1. Volume-Price Trend (VPT)
        # VPT = Cumulative(Volume * (Close - PrevClose) / PrevClose)
        vpt = (data['volume'] * data['close'].pct_change()).cumsum()
        df['vpt_signal'] = np.tanh(vpt.pct_change(5) * 10) # Normalized
        
        # 2. Relative Volume (RVOL)
        avg_vol = data['volume'].rolling(20).mean()
        df['rvol'] = data['volume'] / avg_vol
        
        # 3. Illiquidity (Amihud)
        # |Return| / (Price * Volume)
        df['illiquidity'] = data['close'].pct_change().abs() / (data['close'] * data['volume'])
        
        return df