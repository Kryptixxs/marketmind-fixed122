from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Dict, Optional, List

class OrderSide(Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderType(Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"
    STOP = "STOP"

class OrderStatus(Enum):
    PENDING = "PENDING"
    PARTIAL = "PARTIAL"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

@dataclass(slots=True)
class Bar:
    symbol: str
    timestamp: datetime # End of bar timestamp to prevent lookahead
    open: float
    high: float
    low: float
    close: float
    volume: float
    vwap: float
    trade_count: int

@dataclass(slots=True)
class Order:
    order_id: str
    symbol: str
    side: OrderSide
    order_type: OrderType
    quantity: float
    price: Optional[float]
    status: OrderStatus
    timestamp: datetime

@dataclass(slots=True)
class Fill:
    fill_id: str
    order_id: str
    symbol: str
    quantity: float
    price: float
    timestamp: datetime
    commission: float

@dataclass(slots=True)
class Position:
    symbol: str
    quantity: float
    average_price: float
    unrealized_pnl: float
    realized_pnl: float
