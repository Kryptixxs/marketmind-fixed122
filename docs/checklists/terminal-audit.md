# Terminal Audit Checklist

## Visual Density
- [ ] No black voids: every panel always has content
- [ ] No centered/max-width wrappers
- [ ] No rounded corners or shadows
- [ ] Padding ≤ 4px everywhere
- [ ] Row height 16–18px for tables
- [ ] Monospace font, 10–11px default
- [ ] tabular-nums on all numeric columns

## Architecture
- [ ] No page navigation — everything is function-in-panel
- [ ] Each panel has independent security + mnemonic context
- [ ] Back/forward works per panel (history stack)
- [ ] Clicking a ticker nests within the same panel
- [ ] Command line + GO is the primary navigation method
- [ ] MENU overlay shows related functions per sector
- [ ] HELP overlay exists (single press: function help, double: desk)

## Functions
- [ ] WEI: dense global index table with flash
- [ ] TOP: timestamped headline list with source codes
- [ ] DES: 2-column fundamentals + summary + related securities
- [ ] CN: company-filtered news
- [ ] HP: historical pricing table (60 rows, bold every 5th)
- [ ] DVD: dividend history table
- [ ] MGMT: management roster (15 rows)
- [ ] OWN: ownership table (20 holders, colored change)
- [ ] RELS: peer grid with click-to-navigate
- [ ] FA: financial analysis with Income/BS/CF tabs
- [ ] GP: canvas chart with grid, volume pane, axis labels
- [ ] ECO: economic calendar with country flags
- [ ] FXC: currency cross matrix
- [ ] IMAP: sector heatmap (treemap style)
- [ ] ALRT: alerts monitor with add/evaluate
- [ ] BLTR: blotter table
- [ ] ORD: order ticket form
- [ ] IB: messaging with send/receive
- [ ] EVT: corporate events timeline

## Interaction
- [ ] Flash engine: green/red flashes on updates (150ms)
- [ ] PageUp/PageDown scroll tables by page
- [ ] Panel focus: click or Alt+1-4
- [ ] Ctrl+Tab cycles panels
- [ ] Link groups: color-coded panel sync
- [ ] Favorites: star toggle per security/function
- [ ] Workspace: WS <name> GO saves/restores

## Data
- [ ] Simulated streaming via web worker
- [ ] VWAP/MACD/spreads computed in worker
- [ ] Status bar shows latency + FPS + connection
