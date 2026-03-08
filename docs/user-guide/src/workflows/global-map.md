# Workflow: Global Map Intelligence

## The Map Stack

MarketMind Terminal has 10 geo-intelligence functions accessible via the GEO family:

| Code | Title | Opens |
|------|-------|-------|
| **GEO** | Global Intelligence Map | Primary world map — click any country |
| **GEO.N** | Geo News Heat | News intensity overlay by region |
| **GEO.C** | Company Footprint Map | Facility locations + exposure |
| **GEO.R** | Regional Risk Map | Risk score overlay |
| **GEO.M** | Macro Map | Macro signal overlay by country |
| **GEO.X** | Cross-Border Exposure | Cross-border risk map |
| **GEO.S** | Supply Chain Disruption Map | Supply chain risk geography |
| **GEO.E** | Energy & Commodities Map | Energy/commodity production geography |
| **GEO.F** | Freight & Shipping Lanes | Freight route disruption overlay |
| **GEO.A** | Alerted Regions | Regions with active alerts |

## Complete Map Workflow

```
Step 1:  GEO GO          → Primary world map, click any country
Step 2:  RGN GO          → Region dossier for clicked country
Step 3:  GEO.N GO        → News intensity — where are stories originating?
Step 4:  NMAP GO         → News map overlay (stories plotted on map)
Step 5:  GEO.R GO        → Risk map (geopolitical/economic risk scores)
Step 6:  GEO.M GO        → Macro signals by country
Step 7:  AAPL US GEO.C GO → Company facility footprint
Step 8:  AAPL US SCN GO  → Supply chain network
Step 9:  GEO.S GO        → Supply chain disruption map
Step 10: SHOCK.G GO      → Geo shock simulator (test regional disruptions)
```

## Region Dossier Drill-Down

From **RGN GO**, drill into:
- **RGN.C** → Companies in region
- **RGN.N** → Regional news center
- **RGN.M** → Regional macro monitor
- **RGN.R** → Regional risk register

## From Map to Ticker

```
GEO → click US → RGN.C (US companies) → click AAPL → DES
GEO.S → supply disruption signal → SCN → AAPL US SCN → CUST (customers)
```

## Pitfalls

- MapLibre requires tile loading from CDN (first load ~2–5 seconds)
- GEO sub-functions work as standalone mnemonics — type them directly
- Country overlays are rendered client-side even without tiles
- NMAP and GEO.N show simulated news intensity, not real geographic data
