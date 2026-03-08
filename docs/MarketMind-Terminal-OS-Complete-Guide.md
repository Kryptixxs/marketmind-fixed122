# MarketMind Terminal OS Complete Guide

Version: 2026-03-08  
Audience: First-time users, traders, researchers, desk operators, and admins  
Mode: Bloomberg-inspired dense workstation (keyboard-first, drill-first, context-first)

---

## 1) What this product is

MarketMind is a **terminal OS-style market workstation**, not a dashboard.  
You work in panes, mnemonics, command-line actions, drill links, and overlays.

Core principles:

- Dense information over decorative UI
- Keyboard-first operation
- Drill everywhere (click/Shift+Click/Alt+Click/right-click)
- Provenance tags on values (`SIM`, `LIVE`, `STALE`)
- No dead space: panels auto-fill with contextual blocks when needed

---

## 2) First 10 minutes quickstart

### 2.1 Open and orient

1. Launch app.
2. Look at the top system strips:
   - System strip: times, feed status, latency, fps, alerts/messages, workspace
   - Command-state strip: focused pane, active mnemonic, active security
3. Click any pane to focus it.

### 2.2 Run your first command

In command line of the focused pane, type:

- `AAPL US Equity DES GO`
- `AAPL US Equity GP GO`
- `MENU GO`
- `HL GO`

### 2.3 Learn 5 essential shortcuts

- `F2` -> Menu
- `F1` -> Help (double `F1` -> help desk stub)
- `Ctrl+K` -> Search overlay
- `Ctrl+L` -> Focus command line
- `Ctrl+B` / `Ctrl+Shift+B` -> Back / Forward history

---

## 3) Mental model: entities, mnemonics, panes

### 3.1 Entities

Entities are drillable objects: securities, fields, news, functions, countries, etc.

### 3.2 Mnemonics

Every screen is a mnemonic (e.g., `DES`, `GP`, `RELG`, `DOCK`, `ALRT+`).

### 3.3 Panes

Each pane has independent state:

- security
- mnemonic
- filters
- history
- selection and scroll

Pane link groups can sync security across panes.

---

## 4) Universal interaction contract

These actions are system-wide:

- **Click** -> open/drill in place
- **Shift+Click** -> send/open in another pane
- **Alt+Click** -> inspector overlay
- **Right-click** -> context menu

Keyboard equivalents:

- `Enter` -> drill/open
- `Shift+Enter` -> send/open in new pane
- `Alt+Enter` -> inspector
- Arrow keys -> move row/cell selection
- `PageUp`/`PageDown` -> viewport scroll in lists/tables

---

## 5) Panel anatomy

Every pane includes:

1. Header strip (pane id, mnemonic, security, status)
2. Toolbar strip (`◀ ▶ MENU HELP HL RECENT ★ GRAB`)
3. Breadcrumb strip (`Asset > Region > Security > Mnemonic`)
4. Next-actions strip (context mnemonics)
5. Keyboard hint strip
6. Command line
7. Scrollable panel body (plus auto filler blocks when short)

---

## 6) Command line syntax

### 6.1 Standard

- `<SECURITY> <MNEMONIC> GO`
- Examples:
  - `MSFT US Equity DES GO`
  - `NVDA US Equity RELG GO`
  - `SPX Index GP GO`

### 6.2 Utility commands

- `MENU GO`
- `HELP GO`
- `SEARCH GO` / `HL GO`
- `GRAB GO`
- `WS GO`
- `WS <name> GO` (save/load workspace by name)
- `WS DEL <name> GO` (delete workspace)

---

## 7) Search and discovery

- `HL` / `SEARCH`: in-panel search overlay
- `CMDK`: global command palette
- `NAVTREE`: function catalog rail
- `RECENT`: recent items and states
- `BKMK`: stateful bookmarks

Shift+open semantics let you keep current context while branching analysis.

---

## 8) Workspace and layout OS

### 8.1 DOCK/FLOAT/LAYOUT/FOCUS+

- `DOCK`: pane layout mode and pane management
- `FLOAT`: float/attach pane management and pop-out flow
- `LAYOUT`: template application (`Research`, `Execution`, `Macro`, etc.)
- `FOCUS+`: fullscreen active pane and restore

Supported mode concepts:

- tile
- tab
- stack
- float

### 8.2 WS/SNAP/MIG

- `WS`: save/restore workspace
- `SNAP`: timestamped snapshots
- `MIG`: migration/version compatibility scaffolding

Workspaces preserve:

- pane states
- command histories
- dock layout
- pins
- focused pane

---

## 9) Data-driven monitoring and alerts

### 9.1 FLD -> MON+ -> ALRT+

- `FLD`: field catalog
- `MON+`: worksheet-style monitor builder (symbols + selected fields)
- `ALRT+`: field-based advanced alert builder

### 9.2 MON and ALRT (classic workflows)

- `MON`: watchlists and list management
- `ALRT`: alerts monitor and command-style alert creation

All alert actions are policy-aware and audit-logged.

---

## 10) Inspector overlay

Open inspector via:

- `Alt+Click`
- `Alt+Enter`
- context menu -> inspect

Inspector shows:

- entity header, type, provenance, update time
- dense key-value sheet
- related entities
- related functions
- pin and send-to-pane actions

Inspector is panel-anchored and supports full drill actions.

---

## 11) Governance, policy, and audit

### 11.1 Core governance mnemonics

- `ENT`: entitlements matrix
- `COMP`: compliance lock modes
- `POL` / `POLICY`: policy rule controls
- `AUD` / `AUDIT`: full audit trail and replay support
- `ERR`: error console for transparent failures

### 11.2 Guardrails

High-risk actions (copy/export/alert/sending) are checked against:

- role entitlements
- policy rules
- compliance modes

Blocked actions show:

- explicit reason
- recovery hint
- audit event
- error console event

---

## 12) Reliability and operations

### 12.1 Ops mnemonics

- `STATUS` / `STAT`: health and feed status
- `DIAG` / `LAT`: diagnostics and performance
- `OFFLINE` / `CACH`: cache and stale mode
- `UPDATE` / `UPD`: release/version context

### 12.2 Offline behavior

When feeds degrade:

- show cached snapshots
- mark stale values with `STALE`
- keep notes/docs/history available
- avoid blank screens

---

## 13) Collaboration and workflow

- `IB` / `CHAT`: messaging and context-linked collaboration
- `SHARE` / `SHAR`: share pane/entity/workspace links
- `NOTES` / `NOTE`: structured notes
- `TASK`: follow-up tasks linked to entities
- `NOTIF` / `ROUTE`: notification center + routing rules

---

## 14) Admin and platform

- `ADMIN` / `ADM`: administration
- `SRC` / `CFG`: source and mapping
- `API`: key management and developer access
- `WEBHOOK`: event egress scaffolding
- `PLUG`: plugin extensibility scaffolding
- `DLP`: data loss prevention controls

---

## 15) Key mnemonic families (quick map)

### 15.1 Market + core research

`DES`, `HP`, `GP`, `GIP`, `CN`, `TOP`, `FA`, `OWN`, `RELS`, `MGMT`, `DVD`, `ECO`, `FXC`, `IMAP`, `GC`

### 15.2 Geo, network, and news intelligence

`GEO*`, `RELG`, `RELT`, `EVID`, `PATH`, `RGN*`, `NMAP`, `NREL`, `NEX`, `NTIM`, `NQ`

### 15.3 Supply, cross-driver, dossiers

`SCN`, `SCN.R`, `FAC`, `CUST`, `SUPP`, `XDRV`, `BETA.X`, `REGI`, `HEDGE`, `SHOCK.G`, `CMPY`, `SECT`, `INDY`, `CTY`, `CITY`

### 15.4 OS/platform layer

`DOCK`, `FLOAT`, `LAYOUT`, `FOCUS+`, `PINBAR`, `NAVTREE`, `KEYMAP`, `LINK`, `CMDK`, `HL+`, `RECENT`, `WS`, `SNAP`, `MIG`

### 15.5 Governance/reliability/platform

`ENT`, `AUDIT`, `POLICY`, `STATUS`, `DIAG`, `OFFLINE`, `SRC`, `API`, `WEBHOOK`, `PLUG`

---

## 16) Daily workflows (step-by-step)

### 16.1 Equity research workflow

1. `AAPL US Equity DES GO`
2. `CN`, `GP`, `OWN`, `RELS` via next-actions
3. Use inspector on key fields (`Alt+Click`)
4. Save state to `BKMK`
5. Add follow-up in `TASK`

### 16.2 Event risk workflow

1. Open `RGN.R` or `GEO.R`
2. Drill to impacted tickers
3. Validate through `RELG`/`PATH`/`EVID`
4. Build monitor in `MON+`
5. Add field trigger in `ALRT+`

### 16.3 Desk open workflow

1. Load workspace (`WS <name> GO`)
2. Check `STATUS` and `DIAG`
3. Review `ALRT`, `NOTIF`, `TASK`
4. Run analysis and share context link via `SHARE`

---

## 17) Troubleshooting guide

### 17.1 “Action blocked”

Check:

- `ENT` role permissions
- `POLICY`/`POL` rules
- `COMP` mode
- `ERR` details and recovery hint

### 17.2 “Data looks stale”

Check:

- `STATUS` feed counters
- `OFFLINE`/`CACH` mode
- provenance badges and as-of times

### 17.3 “Can’t find function”

Use:

- `CMDK`
- `NAVTREE`
- `MENU` + search overlay

---

## 18) Keyboard reference card

- `Enter`: GO / Drill
- `Shift+Enter`: send/open in new pane
- `Alt+Enter`: inspector
- `Esc`: close overlays / clear command
- `F1`: help (double F1 help desk)
- `F2`: menu
- `Ctrl+K`: search
- `Ctrl+L`: focus command line
- `Ctrl+B`: history back
- `Ctrl+Shift+B`: history forward
- `Ctrl+\``: cycle pane focus
- `Alt+1..Alt+4`: direct pane focus (first four panes)
- Arrow keys: select rows/items
- `PageUp/PageDown`: table/list viewport paging

---

## 19) Visual and data interpretation rules

- Numbers are right-aligned and tabular.
- Color changes:
  - green = positive/up
  - red = negative/down
- Flash highlights indicate recent updates.
- Trust tags:
  - `SIM`: simulated
  - `LIVE`: live-feed or live-like stream
  - `STALE`: aged/cached

---

## 20) Learning path for new users

Week 1:

1. Master command line + 10 shortcuts
2. Learn `DES/GP/CN/RELS/OWN`
3. Use `MENU`, `HL`, `CMDK`

Week 2:

1. Use `DOCK/FLOAT/LAYOUT/WS`
2. Build `MON+` and `ALRT+`
3. Use `BKMK`, `RECENT`, `NAVG/TRAIL`

Week 3:

1. Run geo/network workflows (`GEO*`, `RELG`, `PATH`)
2. Add governance discipline (`AUDIT`, `POLICY`, `ENT`)
3. Operate with reliability screens (`STATUS`, `DIAG`, `OFFLINE`)

---

## 21) Operator checklist (daily)

- System strip green and stable latency/fps
- Workspace loaded and named
- Key panes linked correctly
- Alerts and notifications reviewed
- Policy mode correct for session
- Notes/tasks updated
- End-of-day snapshot/bookmark saved

---

## 22) Appendix: “What to click when lost”

- Need function quickly -> `CMDK`
- Need related actions -> right-click or `F2`
- Need object detail -> `Alt+Click` (inspector)
- Need new branch of analysis -> `Shift+Click`
- Need recover prior state -> `RECENT`, `BKMK`, `TRAIL`
- Need proof or why blocked -> `AUDIT` + `ERR` + `POLICY`

---

End of guide.

