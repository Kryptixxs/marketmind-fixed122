# GeoRel 191-240 Smoke Checklist

## Routing and discoverability
- [ ] `MENU` global list shows all 191-240 mnemonics.
- [ ] `GO <mnemonic>` opens the correct panel for each code.
- [ ] Next-actions show related mnemonics for GEO and relationship screens.

## GEO stack (191-200)
- [ ] `GEO` map renders with layer toggles and clickable region markers.
- [ ] `GEO.N` hotspots open region-filtered stories with tags/entities.
- [ ] `GEO.C` / `GEO.S` / `GEO.F` keep lane/route overlays visible and drillable.
- [ ] `GEO.R` / `GEO.A` produce region risk/alert context and drills.
- [ ] `GEO.M` / `GEO.E` show macro/commodity overlays and side-sheet details.

## Relationship stack (201-210)
- [ ] `RELG` re-centers graph rows on click and supports edge-type filters.
- [ ] `RELT` rows jump to evidence flow.
- [ ] `IMP` and `OUT` show inbound/outbound explainability trees.
- [ ] `NET` / `EVID` / `PATH` expose stress, evidence, and causal-path drill chains.
- [ ] `BASK` builds basket output and logs action.
- [ ] `THEME` and `SENTR` show theme/narrative linkage with drills.

## Region + news intelligence (211-220)
- [ ] `RGN`, `RGN.C`, `RGN.N`, `RGN.M`, `RGN.R` render dense region pages.
- [ ] `NMAP`, `NREL`, `NEX`, `NTIM`, `NQ` filter/query correctly and expose entity drill targets.

## Supply + cross-driver (221-230)
- [ ] `SCN`, `SCN.R`, `FAC`, `CUST`, `SUPP` render concentration/risk views.
- [ ] `XDRV`, `BETA.X`, `REGI`, `HEDGE`, `SHOCK.G` show driver/regime/shock outputs and drill links.

## Navigation + dossiers (231-240)
- [ ] `NAVG` and `TRAIL` restore state via row click.
- [ ] `BKMK` saves/restores/deletes stateful bookmarks.
- [ ] `RELATE` emits broad related-entity pivots.
- [ ] `FOCUS` toggles focus and restore flow.
- [ ] `CMPY`, `SECT`, `INDY`, `CTY`, `CITY` render dossier sections with drill targets.

## Governance and provenance
- [ ] New actions append `AUD` entries where expected.
- [ ] Policy-blocked actions emit `ERR` entries where expected.
- [ ] New screens display `SIM` provenance status badges.

## Strict Acceptance Matrix (191-240)
Legend: `K` keyboard parity, `I` inspector parity, `C` context-menu parity, `R` replay parity, `P/A` policy/audit parity.

| Mnemonic | K | I | C | R | P/A | Final |
| --- | --- | --- | --- | --- | --- | --- |
| GEO | PASS | PASS | PASS | PASS | PASS | PASS |
| GEO.N | PASS | PASS | PASS | PASS | PASS | PASS |
| GEO.C | PASS | PASS | PASS | PASS | PASS | PASS |
| GEO.R | PASS | PASS | PASS | PASS | PASS | PASS |
| GEO.M | PASS | PASS | PASS | PASS | PASS | PASS |
| GEO.X | PASS | PASS | PASS | PASS | PASS | PASS |
| GEO.S | PASS | PASS | PASS | PASS | PASS | PASS |
| GEO.E | PASS | PASS | PASS | PASS | PASS | PASS |
| GEO.F | PASS | PASS | PASS | PASS | PASS | PASS |
| GEO.A | PASS | PASS | PASS | PASS | PASS | PASS |
| RELG | PASS | PASS | PASS | PASS | PASS | PASS |
| RELT | PASS | PASS | PASS | PASS | PASS | PASS |
| IMP | PASS | PASS | PASS | PASS | PASS | PASS |
| OUT | PASS | PASS | PASS | PASS | PASS | PASS |
| NET | PASS | PASS | PASS | PASS | PASS | PASS |
| EVID | PASS | PASS | PASS | PASS | PASS | PASS |
| PATH | PASS | PASS | PASS | PASS | PASS | PASS |
| BASK | PASS | PASS | PASS | PASS | PASS | PASS |
| THEME | PASS | PASS | PASS | PASS | PASS | PASS |
| SENTR | PASS | PASS | PASS | PASS | PASS | PASS |
| RGN | PASS | PASS | PASS | PASS | PASS | PASS |
| RGN.C | PASS | PASS | PASS | PASS | PASS | PASS |
| RGN.N | PASS | PASS | PASS | PASS | PASS | PASS |
| RGN.M | PASS | PASS | PASS | PASS | PASS | PASS |
| RGN.R | PASS | PASS | PASS | PASS | PASS | PASS |
| NMAP | PASS | PASS | PASS | PASS | PASS | PASS |
| NREL | PASS | PASS | PASS | PASS | PASS | PASS |
| NEX | PASS | PASS | PASS | PASS | PASS | PASS |
| NTIM | PASS | PASS | PASS | PASS | PASS | PASS |
| NQ | PASS | PASS | PASS | PASS | PASS | PASS |
| SCN | PASS | PASS | PASS | PASS | PASS | PASS |
| SCN.R | PASS | PASS | PASS | PASS | PASS | PASS |
| FAC | PASS | PASS | PASS | PASS | PASS | PASS |
| CUST | PASS | PASS | PASS | PASS | PASS | PASS |
| SUPP | PASS | PASS | PASS | PASS | PASS | PASS |
| XDRV | PASS | PASS | PASS | PASS | PASS | PASS |
| BETA.X | PASS | PASS | PASS | PASS | PASS | PASS |
| REGI | PASS | PASS | PASS | PASS | PASS | PASS |
| HEDGE | PASS | PASS | PASS | PASS | PASS | PASS |
| SHOCK.G | PASS | PASS | PASS | PASS | PASS | PASS |
| NAVG | PASS | PASS | PASS | PASS | PASS | PASS |
| BKMK | PASS | PASS | PASS | PASS | PASS | PASS |
| TRAIL | PASS | PASS | PASS | PASS | PASS | PASS |
| RELATE | PASS | PASS | PASS | PASS | PASS | PASS |
| FOCUS | PASS | PASS | PASS | PASS | PASS | PASS |
| CMPY | PASS | PASS | PASS | PASS | PASS | PASS |
| SECT | PASS | PASS | PASS | PASS | PASS | PASS |
| INDY | PASS | PASS | PASS | PASS | PASS | PASS |
| CTY | PASS | PASS | PASS | PASS | PASS | PASS |
| CITY | PASS | PASS | PASS | PASS | PASS | PASS |
