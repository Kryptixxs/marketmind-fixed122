# Workflow: Build a Monitor

## Goal

Create a streaming watchlist with custom columns for your specific universe.

## Step-by-Step

```
Step 1: MON GO                  → Open Monitor / Watchlist
Step 2: Type symbol + Enter     → Add AAPL US Equity, MSFT US Equity, etc.
Step 3: MON+ GO                 → Advanced Monitor Builder (custom columns)
Step 4: FLD GO                  → Find fields to add as columns
                                  (e.g. PE_RATIO, BETA, VOL_30D)
Step 5: Click "Add→MON"         → Adds field as column to active monitor
Step 6: ALRT+ GO                → Set field-based alerts
Step 7: WS mymonitor GO         → Save this monitor as a workspace
```

## MON+ — Advanced Monitor Builder

Open `MON+ GO`:
- **Symbol input**: comma-separated list of full symbols
- **Field filter**: type to search available fields
- Columns auto-populate from selected field IDs
- **SAVE button**: persists symbols list to localStorage

## Adding Custom Columns via FLD

1. `FLD GO` → Search for the field you want (e.g. "dividend yield")
2. Click the **Add→MON** button in the FLD row
3. Return to `MON GO` — new column appears automatically

## Setting Alerts from Monitor

From any row in MON:
1. **Right-click** → "Alert on field"
2. Or use `ALRT+ GO` directly:
   - Symbol input
   - Field selector (dropdown from FLD catalog)
   - Operator (>, <)
   - Threshold value
   - **CREATE** button

## Keyboard in MON

| Action | Key |
|--------|-----|
| Add symbol | Type in input + Enter |
| Create new list | Click "New List" button |
| Sort by column | Click column header |
| Filter | Type in filter box |
| Switch list | Click list tab |

## Pitfalls

- Symbols must be in Bloomberg format: `AAPL US Equity` not just `AAPL`
- Custom columns from FLD persist in localStorage per list
- Max 80 symbols in standard mode, 160 in High Density Live Mode
