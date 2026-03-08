# Terminal Regression Audit

## Core Governance
- [ ] Are we enforcing a strict structural grammar instead of a panel collage?
- [ ] Is there a single primary decision visible immediately per function?
- [ ] Are Primary / Secondary / Tertiary bands strictly enforced with fixed proportions?

## Components & Layout
- [ ] Are panels properly typed (`VERDICT`, `SNAPSHOT`, `DIAGNOSTIC`, `FLOW`, `VULNERABILITY`, `ORDER_STATE`, `HISTORICAL`)?
- [ ] Are band limits respected (Primary 6, Secondary 8, Tertiary 8)?
- [ ] Do `HISTORICAL` panels default to collapsed?
- [ ] Are charts compact, purposeful, and not dominating the view?
- [ ] Is deep detail collapsed by default?
- [ ] Are there zero instances of improvised layout (`max-w-*`, `mx-auto`, centered wrappers)?
- [ ] Are band containers strictly enforcing `flex-1 w-full min-w-0 min-h-0`?

## Data Modeling
- [ ] Do charts receive data exclusively from the module data model (no chart-only generators)?
- [ ] Does each module have exactly one data model driving both tables and charts?
