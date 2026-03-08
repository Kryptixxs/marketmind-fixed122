# ORD — Order Ticket

<span class="mnemonic-badge">ORD</span>
<span class="scope-badge">🔒 Security Scoped</span>
<span class="scope-badge">OpsConsole</span>

## Purpose

Submit simulated buy/sell orders with quantity, type (MKT/LMT), and price.

## Inputs

Security required.

## Screen Layout

1. **Order form (symbol, side, type, quantity, price)**
2. **Recent orders strip**

## Key Fields

| Field ID | Description |
|---|---|
| `SYMBOL` | SIM-sourced SYMBOL value |
| `SIDE` | SIM-sourced SIDE value |
| `ORDER_TYPE` | SIM-sourced ORDER_TYPE value |
| `QTY` | SIM-sourced QTY value |
| `PRICE` | SIM-sourced PRICE value |

## Drill Paths

- Click sent order → BLTR blotter

## Keyboard Controls

- BUY/SELL toggle
- MKT/LMT selector
- Enter → submit order (respects KILL switch)

## Opening Examples

```
AAPL US ORD GO
```

## Common Pitfalls

- ⚠️ All orders are SIM-only. KILL switch disables order entry. Check COMP/POL if blocked.

## Related Functions

[BLTR](/mnemonics/BLTR)  ·  [TCA](/mnemonics/TCA)  ·  [VEN](/mnemonics/VEN)  ·  [IMP](/mnemonics/IMP)  ·  [KILL](/mnemonics/KILL)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
