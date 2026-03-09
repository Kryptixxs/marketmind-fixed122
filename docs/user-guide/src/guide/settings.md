# Settings & Personalization

## Preferences Panel (PREF / SETTINGS)

Open with: `PREF GO`, `SET GO`, or `SETTINGS GO`  
Also available from the gear icon in terminal global chrome and `/app/settings`.

### Core V1 Settings

| Setting | Options | Effect |
|---------|---------|--------|
| **Contrast Mode** | Normal / High | Improves text-legibility and panel separation |
| **Density** | Compact / Standard | Controls row height and panel packing |
| **Font Size** | S / M / L | Improves readability in dense views |
| **Update Flash** | Off / On | Enables cell flash only when formatted value actually changes |
| **Time Display** | ET / Local / GMT | Sets system strip clock display mode |

Settings persist per user session and are restored automatically.

### Workspace and Layout

| Mode | Description |
|------|-------------|
| **Tile** | Grid of resizable panes (default) |
| **Tab** | Tabbed panes in a single region |
| **Stack** | Vertically stacked panes |

### Streaming Mode

| Toggle | Effect |
|--------|--------|
| **Live Mode ON** | Increases streaming rate, fills panels with more data |
| **High Density ON** | Reduces row padding, shows more rows per panel |

### Update Flash (WEI / tables)

- Flash triggers only when the **displayed value changes**
- Numeric comparisons use epsilon checks to avoid noise flicker
- Per-cell throttling prevents constant flashing in fast streams
- Set **Update Flash = Off** for conservative visual behavior

## Workspace Save/Restore

```
WS myname GO          → Save current state as "myname" (or load if exists)
WS DEL myname GO      → Delete workspace
WS GO                 → Open workspace manager (list all)
WS:MARKET-WALL GO     → Load preset: 8-pane market wall
WS:NEWSROOM GO        → Load preset: newsroom layout
WS:RESEARCH GO        → Load preset: research layout
WS:TRADING GO         → Load preset: trading layout
```

**What a workspace saves:**
- Full pane docking tree (splits, tabs, sizes)
- Each panel's active mnemonic, security, timeframe
- Navigation history per panel
- Command history per panel
- Pin strip items
- Dock layout settings

## Keyboard Mapping (KEYMAP)

Open with: `KEYMAP GO`

View and save keyboard binding profiles. Current bindings are shown in a table.  
Click **SAVE** to persist profile. Click **RESET** to restore defaults.

## Export Settings

Open with: `EXP GO` or `EXPCTR GO`

- Panel snapshot exports (JSON) via **GRAB GO**
- Report builder via **RPT GO**
- Clip library via **CLIP GO**
- All exports are logged in the audit trail (AUD)

## Admin & Entitlements

| Function | Purpose |
|---------|---------|
| **ENT GO** | View and manage entitlement matrix |
| **COMP GO** | Compliance lock modes (normal / restricted / frozen) |
| **POL GO** | Policy rules engine (allow/block actions by role) |
| **POLICY GO** | Full policy rules block/allow interface |
| **ROLE GO** | Roles and permissions assignment |
| **ADMIN GO** | Admin console (users, roles, entitlements, policies) |
| **AUD GO** | Command audit log |
| **AUDIT GO** | Full audit trail with replay |
