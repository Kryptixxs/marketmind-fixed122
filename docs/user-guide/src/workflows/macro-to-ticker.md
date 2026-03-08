# Workflow: Macro Context to Ticker Impact

## Goal

Build a research chain from global macro signals down to specific ticker impacts.

## Step-by-Step Chain

```
Step 1: WEI GO       → Start at world equity indices (macro overview)
Step 2: IMAP GO      → Sector heatmap (which sectors are moving)
Step 3: FXC GO       → FX cross matrix (currency drivers)
Step 4: ECO GO       → Economic calendar (what releases are upcoming)
Step 5: GC GO        → Yield curve (rates environment)
Step 6: XAS GO       → Cross-asset spread board (risk premium)
Step 7: GEO GO       → Global map (geographic signal)
Step 8: XDRV GO      → Cross-driver dashboard (factor attribution for a security)
Step 9: RV GO        → Relative value vs benchmark
Step 10: RELG GO     → Relationship graph (peer/supply chain transmission)
```

## Key Connections

```
Macro signal     →  Sector impact  →  Ticker impact
ECO release      →  IMAP sector    →  RELS peers
FX move (FXC)    →  XAS spread     →  DES security
Geo event (GEO)  →  RGN macro      →  SCN supply chain
```

## Multi-Pane Setup for Macro Research

```
WS:MACRO GO          → Load macro preset (WEI, ECO, GEO.M, XAS, REGI, NQ)
```

Or manual:
```
Pane 1: WEI GO
Pane 2: ECO GO
Pane 3: IMAP GO
Pane 4: GEO.M GO
```

## Related Functions

WEI · IMAP · FXC · GC · ECO · XAS · CORR+ · GEO · GEO.M · XDRV · REGI · BETA.X · RELG · RELT · SHCK · REG
