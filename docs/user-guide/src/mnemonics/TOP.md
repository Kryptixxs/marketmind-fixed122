# TOP — Top News / News Hub

<span class="mnemonic-badge">TOP</span>
<span class="scope-badge">🌍 Global</span>
<span class="scope-badge">NewsHub</span>

## Purpose

Global top news feed with headline tape, extracted entities, impacted tickers, and theme tags.

## Inputs

No security required (global); CN version requires security.

## Screen Layout

1. **Headline tape**
2. **Theme tags**
3. **Impacted tickers list**
4. **Market snapshot strip**

## Key Fields

| Field ID | Description |
|---|---|
| `HEADLINE` | SIM-sourced HEADLINE value |
| `SOURCE` | SIM-sourced SOURCE value |
| `ENTITY_TAGS` | SIM-sourced ENTITY_TAGS value |
| `IMPACT_SCORE` | SIM-sourced IMPACT_SCORE value |

## Drill Paths

- Click headline → NTIM (news timeline)
- Click ticker → DES
- Click theme tag → THEME

## Keyboard Controls

- ↑↓ select headline
- Enter → drill story
- Right-click → context menu with "Open NREL"

## Opening Examples

```
TOP GO  |  AAPL US CN GO
```

## Common Pitfalls

- ⚠️ Headlines are SIM-generated with realistic structure. Not real news.

## Related Functions

[CN](/mnemonics/CN)  ·  [N](/mnemonics/N)  ·  [NMAP](/mnemonics/NMAP)  ·  [NREL](/mnemonics/NREL)  ·  [NTIM](/mnemonics/NTIM)  ·  [SENT](/mnemonics/SENT)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
