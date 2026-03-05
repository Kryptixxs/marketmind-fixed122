from abc import ABC, abstractmethod
from typing import List, Dict, Any
from datetime import datetime
import pandas as pd
from quant_engine.core.models import Bar, Order, Fill

class IDataSource(ABC):
    @abstractmethod
    def fetch_historical_bars(self, symbol: str, start: datetime, end: datetime) -> pd.DataFrame:
        """Fetch historical bars, indexed by timestamp."""
        pass
        
    @abstractmethod
    def stream_live_bars(self, symbols: List[str]) -> Any:
        """Returns generator or async iterator of Bars."""
        pass

class IFeatureGenerator(ABC):
    @abstractmethod
    def generate(self, data: pd.DataFrame) -> pd.DataFrame:
        """
        Must ensure strictly causal filtering.
        Output index [t] must ONLY depend on input index [<=t].
        """
        pass

class IModel(ABC):
    @abstractmethod
    def train(self, features: pd.DataFrame, targets: pd.Series) -> None:
        """Train model with Purged and Embargoed CV."""
        pass
        
    @abstractmethod
    def predict(self, current_features: pd.DataFrame) -> pd.Series:
        """
        Produces forecast for t+h using information up to t.
        """
        pass

class IRegimeDetector(ABC):
    @abstractmethod
    def detect_regime(self, market_data: pd.DataFrame) -> int:
        """
        Returns integer representing current hidden Markov state or volatility regime.
        Must use online (forward) inference only.
        """
        pass

class IRiskManager(ABC):
    @abstractmethod
    def validate_allocation(self, proposed_weights: Dict[str, float], current_portfolio: Dict[str, float], covariance: pd.DataFrame) -> Dict[str, float]:
        """
        Shrinks/modifies proposed weights to comply with limits (CVaR, sector exposure).
        """
        pass

class IPortfolioAllocator(ABC):
    @abstractmethod
    def allocate(self, predictions: Dict[str, float], covariance: pd.DataFrame, regime: int) -> Dict[str, float]:
        """
        Runs convex optimization / HRP to convert signal predictions to target portfolio weights.
        """
        pass

class IExecutionInterface(ABC):
    @abstractmethod
    def execute_target_weights(self, target_weights: Dict[str, float], current_positions: Dict[str, float]) -> List[Order]:
        """
        Translates target weights into a schedule of child orders minimizing implementation shortfall.
        """
        pass
