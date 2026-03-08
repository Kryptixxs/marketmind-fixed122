# OWN — Institutional Ownership

<span class="mnemonic-badge">OWN</span>
<span class="scope-badge">🔒 Security Scoped</span>
<span class="scope-badge">ReferenceSheet</span>

## Purpose

Ranked list of institutional holders with stake %, shares, and value. Shows recent changes.

## Inputs

Security (equity) required.

## Screen Layout

1. **Holder ranking table**
2. **Stake concentration chart**
3. **Change in position column**

## Key Fields

| Field ID | Description |
|---|---|
| `HOLDER` | SIM-sourced HOLDER value |
| `STAKE_PCT` | SIM-sourced STAKE_PCT value |
| `SHARES_M` | SIM-sourced SHARES_M value |
| `VALUE_BN` | SIM-sourced VALUE_BN value |
| `CHG_M` | SIM-sourced CHG_M value |

## Drill Paths

- Click holder row → CMPY dossier for that holder

## Keyboard Controls

- ↑↓ navigate
- Click col → sort by stake/change

## Opening Examples

```
MSFT US OWN GO
```

## Common Pitfalls

- ⚠️ Ownership data is SIM. Changes column shows simulated delta, not real 13F data.

## Related Functions

[DES](/mnemonics/DES)  ·  [MGMT](/mnemonics/MGMT)  ·  [RELS](/mnemonics/RELS)  ·  [RELG](/mnemonics/RELG)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
