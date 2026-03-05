from sqlalchemy import Column, Integer, String, Float, DateTime, BigInteger, Index
from sqlalchemy.orm import declarative_base

Base = declarative_base()

class MarketBar(Base):
    __tablename__ = 'market_bars'
    
    id = Column(BigInteger, primary_key=True, autoincrement=True)
    symbol = Column(String(20), nullable=False)
    timestamp = Column(DateTime(timezone=True), nullable=False)
    open = Column(Float, nullable=False)
    high = Column(Float, nullable=False)
    low = Column(Float, nullable=False)
    close = Column(Float, nullable=False)
    volume = Column(Float, nullable=False)
    vwap = Column(Float, nullable=False)
    trade_count = Column(Integer, nullable=False)
    
    __table_args__ = (
        Index('idx_symbol_timestamp', 'symbol', 'timestamp', unique=True),
    )

class ModelMetadata(Base):
    __tablename__ = 'model_metadata'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(50), nullable=False, unique=True)
    trained_at = Column(DateTime(timezone=True), nullable=False)
    out_of_sample_sharpe = Column(Float, nullable=True)
    parameters = Column(String, nullable=False) # JSON encoded
