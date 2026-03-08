# Terminal OS — Workspace & Pane Model

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│  SYSTEM STRIP         MM ● SIM  ET 14:23:01  GMT 19:23:01   │
│  GLOBAL COMMAND BAR   P1 > AAPL US DES GO          [GO]     │
├────────────────────────────────────────────┬────────────────┤
│  PANEL 1                    PANEL 2        │  PANEL 3       │
│  ┌──────────────────────────────────────┐  │  ┌──────────┐  │
│  │ P1  DES  AAPL US Equity  ● FOCUSED  │  │  │ P2  WEI  │  │
│  │ ◀ ▶  MENU  HELP  HL  RECENT  ★      │  │  │          │  │
│  │ EQUITY › US › AAPL US Equity › DES   │  │  │          │  │
│  │ Next: HP  GP  CN  OWN  FA  RELS      │  │  │          │  │
│  │──────────────────────────────────────│  │  └──────────┘  │
│  │                                      │  │                │
│  │  [PANEL CONTENT]                     │  │                │
│  │                                      │  │                │
│  │  P1 > AAPL US DES GO [GO]            │  │                │
│  └──────────────────────────────────────┘  │                │
└────────────────────────────────────────────┴────────────────┘
```

## Panels (Panes)

Each **panel** (pane) is an independent terminal session with its own:
- Active security and mnemonic
- Navigation history (back/forward)
- Command line
- Overlay state (MENU, HELP, Inspector, Search)

### Panel Chrome (from top to bottom)

| Strip | Contents |
|-------|----------|
| **Header** | Panel # · Mnemonic · Security · SIM badge · FOCUSED indicator · pane controls |
| **Toolbar** | ◀▶ back/fwd · MENU · HELP · HL · GRAB · RECENT · ★ favorites · FOCUS+ |
| **Breadcrumb** | AssetClass › Region › Security › Mnemonic (each clickable) |
| **Next Actions** | 5–8 context-relevant function chips (keyboard navigable) |
| **Keyboard Hint** | Context-specific shortcuts for current mnemonic |
| **Command Line** | P1> input field · GO button |
| **Content area** | The function view + auto-fill blocks if view is short |

## Workspace Model

A **workspace** is a named snapshot of:
- The full docking tree (splits, tabs, sizes)
- All panel states (active mnemonic, security, history)
- Command histories
- Pin strip items

**Preset workspaces:**
```
WS:MARKET-WALL GO    → 8-pane market wall layout
WS:NEWSROOM GO       → News-focused layout  
WS:RESEARCH GO       → Research workflow layout
WS:TRADING GO        → Trading/execution layout
```

## Focus Model

- One panel is **focused** at a time (bright border + FOCUSED badge)
- **Alt+1…9** → jump to pane N
- **Ctrl+`** → cycle through all panes
- **Ctrl+Shift+`** → switch between workspace A and B (2-up mode)
- Clicking inside any panel transfers focus to it

## Docking Engine

```
DOCK GO      → Manage pane engine (tile/tab/stack)
FLOAT GO     → Pop-out / floating pane manager
NP GO        → New tab pane
NP H GO      → Split current pane horizontally
NP V GO      → Split current pane vertically
DOCK → HD ON  → High Density mode
DOCK → LIVE:ON → High Density Live mode
```
