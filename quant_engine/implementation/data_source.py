import asyncio
from datetime import datetime
from typing import List, AsyncIterator
import pandas as pd
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from quant_engine.interfaces.base import IDataSource
from quant_engine.db.schema import MarketBar
from quant_engine.core.models import Bar

class PostgresDataSource(IDataSource):
    def __init__(self, db_uri: str, pool_size: int = 20):
        self.engine = create_engine(db_uri, pool_size=pool_size, max_overflow=10)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)

    def fetch_historical_bars(self, symbol: str, start: datetime, end: datetime) -> pd.DataFrame:
        """
        Fetches historical bars with exact temporal alignment.
        Must strictly filter by timestamp <= end to prevent lookahead bias.
        """
        with self.SessionLocal() as session:
            stmt = select(
                MarketBar.timestamp,
                MarketBar.open,
                MarketBar.high,
                MarketBar.low,
                MarketBar.close,
                MarketBar.volume,
                MarketBar.vwap,
                MarketBar.trade_count
            ).where(
                MarketBar.symbol == symbol,
                MarketBar.timestamp >= start,
                MarketBar.timestamp <= end
            ).order_by(MarketBar.timestamp.asc())
            
            result = session.execute(stmt).all()
            
            if not result:
                return pd.DataFrame()
            
            df = pd.DataFrame(result)
            df.set_index('timestamp', inplace=True)
            
            # Sanity check: ensure index is monotonically increasing
            if not df.index.is_monotonic_increasing:
                df.sort_index(inplace=True)
                
            return df

    async def stream_live_bars(self, symbols: List[str]) -> AsyncIterator[Bar]:
        """
        Mock implementation of a live websocket stream.
        In production, this connects to a provider (e.g., Databento, Polygon.io)
        and yields Bars strictly sequentially as the period closes.
        """
        while True:
            # Simulate waiting for next bar interval
            await asyncio.sleep(60.0) 
            now = datetime.utcnow()
            for symbol in symbols:
                yield Bar(
                    symbol=symbol,
                    timestamp=now,
                    open=100.0, high=101.0, low=99.0, close=100.5,
                    volume=5000, vwap=100.25, trade_count=150
                )
