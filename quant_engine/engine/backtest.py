import pandas as pd
from typing import List, Dict
from datetime import datetime
from quant_engine.interfaces.base import (
    IDataSource, IFeatureGenerator, IModel, 
    IRiskManager, IPortfolioAllocator, IExecutionInterface
)
from quant_engine.core.models import Bar, Position

class BacktestEngine:
    def __init__(self, 
                 data_source: IDataSource,
                 feature_gen: IFeatureGenerator,
                 model: IModel,
                 allocator: IPortfolioAllocator,
                 risk_manager: IRiskManager,
                 executor: IExecutionInterface,
                 initial_capital: float = 100000.0):
        self.data_source = data_source
        self.feature_gen = feature_gen
        self.model = model
        self.allocator = allocator
        self.risk_manager = risk_manager
        self.executor = executor
        self.capital = initial_capital
        self.positions: Dict[str, float] = {} # symbol -> quantity

    def run(self, symbols: List[str], start: datetime, end: datetime):
        """
        T-step forward simulation.
        """
        # 1. Fetch all data
        # In a real system, we'd iterate through time to prevent lookahead
        # but for this implementation we'll fetch and then slice.
        raw_data = {s: self.data_source.fetch_historical_bars(s, start, end) for s in symbols}
        
        # Get all unique timestamps
        all_ts = sorted(set().union(*(df.index for df in raw_data.values())))
        
        for ts in all_ts:
            # Current information set (strictly <= ts)
            current_data = {s: df.loc[:ts] for s, df in raw_data.items() if ts in df.index}
            if not current_data: continue
            
            # 2. Generate Features
            features = {s: self.feature_gen.generate(df) for s, df in current_data.items()}
            
            # 3. Predict
            predictions = {s: self.model.predict(feat.tail(1)).iloc[0] for s, feat in features.items() if not feat.empty}
            
            # 4. Allocate
            # Simplified covariance for this step
            cov = pd.DataFrame(np.eye(len(symbols)), index=symbols, columns=symbols)
            target_weights = self.allocator.allocate(predictions, cov, regime=0)
            
            # 5. Risk Management
            safe_weights = self.risk_manager.validate_allocation(target_weights, self.positions, cov)
            
            # 6. Execute
            current_prices = {s: df.loc[ts, 'close'] for s, df in current_data.items()}
            orders = self.executor.execute_target_weights(safe_weights, self.positions, current_prices, self.capital)
            
            # 7. Update State (Simulate Fills)
            for order in orders:
                price = current_prices[order.symbol]
                qty = order.quantity if order.side.value == "BUY" else -order.quantity
                self.positions[order.symbol] = self.positions.get(order.symbol, 0.0) + qty
                self.capital -= qty * price # Simplified

        print(f"Backtest complete. Final Equity: {self.capital + sum(q * current_prices[s] for s, q in self.positions.items())}")