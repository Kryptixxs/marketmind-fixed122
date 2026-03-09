# Navigation QA checklist

Validate these behaviors in `/app` and `/app/terminal`.

- **Home button (`Ctrl+H`)**: opens terminal launchpad overlay with recent securities, mnemonics, workspaces, pinned items, and tutorial entry; clicking any row runs the target command in focused pane.
- **Terminal button (`Ctrl+T`)**: returns focus to terminal runtime and focuses command line without resetting workspace layout/history.
- **Workspaces button (`Ctrl+W`)**: opens workspace mode via `WS GO`; can load saved workspace into runtime layout.
- **Monitors button (`Ctrl+M`)**: opens monitor mode via `MON GO`; monitor rows remain drillable within terminal function.
- **Alerts button (`Ctrl+A`)**: opens alert center via `ALRT GO`; triggered items drill to evidence paths.
- **Orders/Blotter button (`Ctrl+B`)**: opens blotter mode via `BLTR GO`; order rows drill to execution/security context.
- **Docs button**: opens terminal docs overlay with docs index/user guide links and tutorial launch action without destroying terminal state.
- **Settings button (`Ctrl+,`)**: opens settings overlay; contrast/density/font/time/flash updates apply immediately.
- **Profile button**: opens profile overlay with preferences jump and sign-out action.
- **Admin button**: gated by role (`ADMIN`/`OPS`); authorized users can launch admin/governance modes (`ADMIN`, `ENT`, `POL`, `AUD`, `COMP`, `ERR`).

## Regression checks

- No dead click targets in top strip.
- Switching top-strip modes does not blank or reset pane history.
- Shift/Alt/Right-click drill semantics remain functional inside terminal mode views after navigation.
- HL, MENU, and NavTree still launch functions from the same catalog index.
