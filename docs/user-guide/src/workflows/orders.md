# Workflow: Orders & Blotter

## Goal

Submit and track simulated orders, review execution quality.

## Step-by-Step

```
Step 1: AAPL US ORD GO          → Open order ticket for AAPL
Step 2: Set BUY or SELL         → Toggle side
Step 3: Set MKT or LMT          → Order type
Step 4: Set quantity            → e.g. 100
Step 5: Set limit price         → (for LMT orders only)
Step 6: Press Enter or SUBMIT   → Submit order
Step 7: BLTR GO                 → View order blotter
Step 8: TCA GO                  → Transaction cost analysis
```

## Kill Switch

If you need to halt all order entry immediately:
```
KILL GO     → Activate kill switch (disables ORD entry)
COMP GO     → Reset compliance mode to normal
```

## Reviewing Execution

| Function | Purpose |
|---------|---------|
| **BLTR** | Streaming order blotter with fill details |
| **TCA** | Transaction cost analysis (slippage, fill rate) |
| **VEN** | Venue map (which execution venue) |
| **IMP** | Market impact model for the order |
| **ANR** | Analytics runtime narrative |

## Pitfalls

- All orders are **simulation only** — no real market connectivity
- KILL switch state persists until reset via COMP
- BLTR data is **session-only** — export with `GRAB GO` before reload
