# Quick Start — 5 Minutes to Productivity

MarketMind Terminal is a Bloomberg-style market intelligence workstation. This guide gets you from zero to productive in five minutes.

## Step 1: Load a Security

Type any of these in the **Global Command Bar** at the top of the screen, then press **Enter** or click **GO**:

```
AAPL US DES GO          → Apple description screen
MSFT US HP GO           → Microsoft historical prices
EURUSD Curncy GP GO     → EUR/USD daily price chart
SPX Index WEI GO        → S&P 500 with world indices
```

**Command grammar:**
```
<TICKER> <MARKET> <MNEMONIC> GO
```

| Part | Example | Meaning |
|------|---------|---------|
| TICKER | AAPL | The symbol |
| MARKET | US / Curncy / Index / Corp / Comdty | Asset class suffix |
| MNEMONIC | DES / HP / GP / FA | The function to run |
| GO | GO | Executes the command |

## Step 2: Navigate Within a Panel

Once a function is open:

| Action | How |
|--------|-----|
| Drill into a row | Click it or press **Enter** |
| Open in new pane | **Shift+Click** or **Shift+Enter** |
| Open Inspector overlay | **Alt+Click** or **Alt+Enter** |
| Context menu | **Right-click** |
| Go back | **Ctrl+B** |
| Go forward | **Ctrl+Shift+B** |

## Step 3: Discover Functions

| How to discover | What to do |
|----------------|-----------|
| **Ctrl+K** or type HL GO | Opens the unified search overlay — find anything |
| **F2** | Opens MENU with related functions for current panel |
| **NAVTREE GO** | Browse all 2,900+ functions with category filters |
| **TUTOR GO** or **F1** | Opens the guided tutorial |

## Step 4: Open Multiple Panes

```
NP GO         → New tab pane
NP H GO       → Split horizontally
NP V GO       → Split vertically
Alt+1…Alt+9   → Focus pane 1–9
Ctrl+`        → Cycle pane focus
```

## Step 5: Save Your Work

```
WS myworkspace GO     → Save current layout + panels as "myworkspace"
WS myworkspace GO     → Load it back (run again with same name)
WS DEL myworkspace GO → Delete a workspace
```

## If Something Goes Wrong

- **Panel empty?** → Type any command + GO, or press **F2** for MENU suggestions
- **Lost?** → Press **Ctrl+K** to search, or type **TUTOR GO**  
- **Wrong security?** → Type the correct security + MNEMONIC GO
- **Back to home screen?** → Type **HOME GO**
- **Navigate history?** → **Ctrl+B** (back), **Ctrl+Shift+B** (forward)

## The 10 Most Useful Commands to Know First

```
WEI GO              → World equity indices monitor
TOP GO              → Top news headlines
AAPL US DES GO      → Any ticker description
AAPL US GP GO       → Price chart
AAPL US HP GO       → Historical pricing table
ECO GO              → Economic calendar
IMAP GO             → Sector heatmap
MON GO              → Your monitor/watchlist
GEO GO              → Global intelligence map
NAVTREE GO          → Browse all 2,900+ functions
```
