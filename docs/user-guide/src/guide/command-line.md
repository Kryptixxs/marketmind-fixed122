# Command Line & GO Execution

## Global Command Bar

The **Global Command Bar** appears at the top of the screen (below the System Strip).  
It always reflects the **focused panel's** input and executes in that panel.

```
Panel N > [input field]                    [GO]
```

## Per-Panel Command Line

Each panel also has its own command line at the bottom of the panel chrome.  
Pressing **Ctrl+L** focuses it. The global bar and panel bar are synchronized.

## Command Grammar

```
<SECURITY> <MNEMONIC> GO
```

### Security Format

```
<TICKER> <EXCHANGE>          → AAPL US
<TICKER> <EXCHANGE> <TYPE>   → AAPL US Equity (optional — auto-inferred)
<PAIR> <TYPE>                → EURUSD Curncy
<INDEX> <TYPE>               → SPX Index
<ISSUER> <TYPE>              → T US Corp
<COMMODITY>                  → CL1 Comdty
```

### Mnemonic Only (global functions)

```
WEI GO     → World equity indices
TOP GO     → Top news
ECO GO     → Economic calendar
GEO GO     → Global map
```

### Timeframe Modifier

```
AAPL US HP 1Y GO    → Historical prices, 1 year
AAPL US GP 5D GO    → Chart, 5 days
Valid: INTRADAY, 1D, 5D, 1W, 1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y, YTD, MAX
```

### Special Commands

```
MENU GO        → Open MENU overlay
HELP GO        → Open HELP / TUTOR
HL GO          → Open Search overlay (same as Ctrl+K)
GRAB GO        → Export panel snapshot to new tab
WS <name> GO   → Save or load workspace by name
WS DEL <name>  → Delete workspace
HD ON / OFF    → Toggle High Density mode
LIVE ON / OFF  → Toggle Live streaming mode
NP GO          → New pane (tab)
NP H GO        → Split horizontal
NP V GO        → Split vertical
WS:PRESET GO   → Apply workstation preset (MARKET-WALL, NEWSROOM, etc.)
```

## Auto-Complete

As you type, a dropdown appears with:
- **Matching securities** (ticker, name)
- **Matching mnemonics** (code, title)

Navigate with **↑↓** · Select with **Enter** or **Tab** · Close with **Esc**

## Typo Correction

The command parser uses **Levenshtein distance** to find close-enough mnemonics.  
If you type **WEL** it resolves to **WEI**. If you type **DEES** it resolves to **DES**.

## Command History

- **↑** (when dropdown is closed) → browse previous commands
- **↓** → forward through history
- History persists in localStorage per panel

## Parse Rules

1. Tokens matching known mnemonics (or close-enough) → mnemonic
2. Tokens matching market sectors (EQUITY, CORP, CURNCY…) → sector
3. Timeframe tokens (1M, 3M…) → timeframe modifier
4. Remaining tokens → security name (auto-appended with Equity if no type given)
