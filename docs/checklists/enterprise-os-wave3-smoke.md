# Enterprise OS Wave 3 Smoke Checklist

## Routing and Discoverability
- [ ] `COLS`, `PIN`, `NAV`, `NX` open via `GO` command in any panel.
- [ ] `MENU` global list includes `COLS`, `PIN`, `NAV`, `NX`.
- [ ] `NEXT` strip suggests governance follow-ups based on current mnemonic.

## ENT / AUD / COMP / POL Deepening
- [ ] `ENT` shows extended capability matrix (export/message/alerts/send/copy/policy-admin).
- [ ] Changing active role in `ENT` writes an audit event.
- [ ] `AUD` supports filtering by type, panel, time window, symbol/mnemonic text.
- [ ] `COMP` mode and lock toggles log `POLICY_CHANGE` audit events.
- [ ] `POL` supports action-based and text-based filtering.
- [ ] `POL` and `COMP` deny modifications for non-policy-admin roles and show errors in `ERR`.

## COLS and PIN
- [ ] `COLS` persists active set by mnemonic across refresh.
- [ ] `COLS` can update comma-separated fields for selected set and persists.
- [ ] `COLS` actions are policy-gated and blocked actions are logged.
- [ ] `PIN` can pin current context and persists rows.
- [ ] `PIN` row click navigates to stored mnemonic/security context.
- [ ] `PIN` add/remove are policy-gated and blocked actions are logged.

## NAV and NX
- [ ] `NAV` displays per-panel navigation trail entries from panel history.
- [ ] `NAV` row click jumps and focuses target panel.
- [ ] `NAV` jump is policy-gated and blocked actions are logged.
- [ ] `NX` lists 6-10 context-aware next actions from related codes and recent audit history.
- [ ] `NX` rows are drillable with click/shift/alt semantics.

## Cross-Cutting Contracts
- [ ] Dense tables support keyboard navigation (Up/Down, Enter, Shift+Enter, Alt+Enter).
- [ ] Right-click context actions still work with no regressions.
- [ ] Provenance badges/labels remain visible where expected.
- [ ] `ERR` captures user-facing policy/permission blocks from Wave 3 actions.
