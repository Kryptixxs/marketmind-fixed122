# Enterprise OS Wave 1 Smoke Checklist

## Namespace + Routing
- Enter each Wave-1 command in command line: `STAT GO`, `LAT GO`, `CACH GO`, `ERR GO`, `ENT GO`, `AUD GO`, `COMP GO`, `POL GO`.
- Enter at least 5 scaffolded commands: `LINE GO`, `MAP GO`, `RPT GO`, `NAV GO`, `NX GO`.
- Verify each opens a routable panel (no wake/fallback blank state).

## Reliability Surfaces
- `STAT`: verify summary metrics render and events tab shows 200 rows.
- `LAT`: verify slow panels, slow mnemonics, and event chain tables render and switch.
- `CACH`: switch mode to `Feed Down` and verify stale flags appear; clear monitor cache.
- `ERR`: verify parser/policy errors appear after intentionally blocked actions.

## Governance Surfaces
- `ENT`: switch active role (e.g., `ANALYST`, `INTERN`, `TRADER`) and verify matrix remains stable.
- `COMP`: toggle lock switches and verify visible lock state updates.
- `POL`: toggle rules by clicking rows and switch mode (`NORMAL`, `RESTRICTED`, `FROZEN`).
- `AUD`: verify type filter, text filter, and snapshot column populate.

## Policy Enforcement
- With `disableExport` enabled, run `GRAB GO` and verify action is blocked and logged.
- With `disableMessaging` enabled, send in `IB` and verify block + ERR/AUD entries.
- With `disableSendToPanel` enabled, Shift+Click drill and verify block + ERR/AUD entries.
- Restrict alert creation role/rule, add alert in `ALRT`, verify block + ERR/AUD entries.

## Regression Guardrails
- Verify existing `WS`, `MON`, `BLTR`, `IB`, `NOTES`, `AUD` still route and function.
- Verify drill semantics remain universal: click / shift-click / alt-click / right-click.
- Verify no blank panels when feed/cache mode is restricted/frozen.
