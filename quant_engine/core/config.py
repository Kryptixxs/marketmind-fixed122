from pydantic import BaseModel, Field

class DatabaseConfig(BaseModel):
    uri: str = Field(..., description="PostgreSQL URI")
    pool_size: int = 20

class RiskConfig(BaseModel):
    max_position_size_usd: float = 1000000.0
    max_portfolio_volatility: float = 0.15
    cvar_confidence_level: float = 0.99
    max_drawdown_limit: float = 0.15

class TradingConfig(BaseModel):
    universe_size: int = 500
    execution_latency_ms: int = 15
    maker_fee: float = -0.0001
    taker_fee: float = 0.0003

class SystemConfig(BaseModel):
    db: DatabaseConfig
    risk: RiskConfig
    trading: TradingConfig
