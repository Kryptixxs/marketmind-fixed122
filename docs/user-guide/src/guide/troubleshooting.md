# Troubleshooting & FAQ

## "Why is a panel empty?"

Panels show the WakeUp screen (home panel) when no mnemonic has been set.  
**Solution:** Type any command + GO. E.g. `WEI GO` or `AAPL US DES GO`.

If a function shows "UNKNOWN MNEMONIC", the code is not in the catalog.  
**Solution:** Use Ctrl+K to search for similar functions, or browse NAVTREE GO.

## "Why is data showing SIM or STALE?"

All data in MarketMind Terminal is **simulated** (SIM) by design for the demo platform.  
STALE means the simulated value hasn't refreshed within its expected cadence.  
**Solution:** Enable **Live Mode** via PREF GO or the DOCK panel. Or reload the panel.

## "Why can't I access a function?"

A policy block prevents access. Check the **ERR console** for the block message.  
**Solution:**
1. `COMP GO` → check current compliance mode
2. `POL GO` → check policy rules  
3. `ENT GO` → check entitlements for your role

## "Why is my drill not working?"

If clicking a row does nothing:
- The row may not have an entity assigned (informational row)
- The function may be a stub (shows enterprise scaffold screen)

**Solution:** Right-click the row to see available context menu actions.  
Or **Alt+Click** to try the Inspector overlay on that row.

## "Why is there no data in my monitor?"

MON requires securities to be added manually.  
**Solution:** Type symbols in the add field (e.g. `AAPL US Equity`) and press Enter.  
Or use MON+ GO to use the Monitor Builder with custom field columns.

## "Why are workspaces not loading?"

Workspaces are stored in localStorage.  
**Solution:** Check that you're using the exact same workspace name.  
Type `WS GO` to see all saved workspaces and their dates.

## "Performance is slow / UI is janky"

1. Disable Live Mode: `PREF GO` → toggle off
2. Reduce pane count: close unused panes with ✕ button
3. Use Compact density: `PREF GO` → select Compact
4. Check diagnostics: `DIAG GO` — shows FPS and render time per pane

## "The map (GEO) isn't loading"

The global map requires MapLibre GL tile loading from external CDN.  
**Solution:** Check internet connection. First load may take 2–5 seconds.  
If tiles don't appear, the map still works — country overlays are rendered client-side.

## "KILL switch was triggered — can't place orders"

```
KILL GO → view kill switch status
COMP GO → reset compliance mode
```
Ensure compliance mode is set to "normal" in COMP panel.

## Error Reference

| Error Type | Meaning |
|-----------|---------|
| `PARSER` | Command could not be parsed. Use format: TICKER MARKET MNEMONIC GO |
| `POLICY` | Action blocked by policy rule. Check COMP/POL |
| `STORAGE` | localStorage operation failed. Check browser quota |
| `POLICY_BLOCK` | Specific action blocked for your role. Check ENT |
