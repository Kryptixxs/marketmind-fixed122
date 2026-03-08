# GP — Price Chart (Daily)

<span class="mnemonic-badge">GP</span>
<span class="scope-badge">🔒 Security Scoped</span>
<span class="scope-badge">AnalyticsBoard</span>

## Purpose

Canvas-based OHLCV candlestick/line chart with volume. Supports timeframe switching and comparison.

## Inputs

Security required. Timeframe via command or UI.

## Screen Layout

1. **Main chart (canvas)**
2. **Volume bars**
3. **Stats strip (return, volatility)**
4. **Related tickers chips**

## Key Fields

| Field ID | Description |
|---|---|
| `PX_LAST` | SIM-sourced PX_LAST value |
| `PCT_CHG` | SIM-sourced PCT_CHG value |
| `VOLUME` | SIM-sourced VOLUME value |
| `VWAP` | SIM-sourced VWAP value |

## Drill Paths

- Click ticker chip → GP of that ticker
- PX_LAST chip → LINE

## Keyboard Controls

- 1D/5D/1M/3M/1Y → change timeframe in command
- Crosshair shows OHLC on hover

## Opening Examples

```
AAPL US GP GO  |  EURUSD Curncy GP 1Y GO
```

## Common Pitfalls

- ⚠️ Canvas chart — not copyable as SVG. Use GRAB+ to export
- ⚠️ Long timeframes (5Y) may show gaps in simulated data

## Related Functions

[GIP](/mnemonics/GIP)  ·  [HP](/mnemonics/HP)  ·  [RV](/mnemonics/RV)  ·  [DES](/mnemonics/DES)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
