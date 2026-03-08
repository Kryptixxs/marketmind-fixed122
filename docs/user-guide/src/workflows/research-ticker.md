# Workflow: Research a Ticker

## Goal

Build a complete picture of a security: fundamentals, financials, price history, ownership, news, events, and peer context.

## Complete Step-by-Step

```
Step 1:  AAPL US DES GO         → Open description screen (fundamentals overview)
Step 2:  AAPL US CN GO          → Company news (what's driving the stock today)
Step 3:  AAPL US HP 1Y GO       → One-year price history (OHLCV table)
Step 4:  AAPL US GP GO          → Price chart (visual candlestick/line)
Step 5:  AAPL US FA GO          → Financial analysis (IS/BS/CF)
Step 6:  AAPL US RELS GO        → Related securities (peers, comps)
Step 7:  AAPL US OWN GO         → Institutional ownership
Step 8:  AAPL US EVT GO         → Corporate events (earnings, dividends, splits)
Step 9:  AAPL US MGMT GO        → Management team
Step 10: AAPL US DVD GO         → Dividend history
```

## Keyboard-Only Path

1. Type `AAPL US DES GO` + **Enter**
2. Press **F2** → MENU shows: HP · GP · CN · OWN · RELS · FA
3. Press **Enter** on HP → jumps to Historical Pricing
4. **Ctrl+B** → back to DES
5. **Shift+Enter** on CN in next actions → opens CN in new pane
6. **Alt+Click** any fundamental value → Inspector with lineage
7. **Ctrl+B** again → return to DES

## Multi-Pane Research Setup

```
Pane 1: AAPL US DES GO
Pane 2: AAPL US GP GO      (NP GO to create, then Shift+Enter from DES)
Pane 3: AAPL US CN GO      (NP GO again)
Pane 4: AAPL US OWN GO     (NP GO)
```

Or load the Research preset: `WS:RESEARCH GO`

## Related Functions

DES · HP · GP · GIP · FA · OWN · RELS · CN · DVD · EVT · MGMT · NOTES · RELG · CMPY · SUPP

## Pitfalls

- **DES requires security**: Always include market suffix (AAPL US, not just AAPL)
- **FA tabs**: Click IS / BS / CF to switch statement types
- **OWN is institutional only**: Individual holders not shown in SIM data
- **RELS uses sector correlation**: Peers are algorithmically determined, not curated
