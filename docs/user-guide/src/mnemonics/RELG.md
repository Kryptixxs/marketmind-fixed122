# RELG — Relationship Graph

<span class="mnemonic-badge">RELG</span>
<span class="scope-badge">🔒 Security Scoped</span>
<span class="scope-badge">RelationshipBoard</span>

## Purpose

Visual relationship graph showing peer/supply-chain/ownership/correlation links for a security.

## Inputs

Security required.

## Screen Layout

1. **Graph edge table**
2. **Evidence panel**
3. **Expand controls**

## Key Fields

| Field ID | Description |
|---|---|
| `REL_TYPE` | SIM-sourced REL_TYPE value |
| `STRENGTH` | SIM-sourced STRENGTH value |
| `EVIDENCE` | SIM-sourced EVIDENCE value |

## Drill Paths

- Click node → DES of related company
- Click edge → EVID

## Keyboard Controls

- Enter → expand selected node

## Opening Examples

```
AAPL US RELG GO
```

## Common Pitfalls

- ⚠️ Graph edges are SIM-generated with realistic relationship types.

## Related Functions

[RELT](/mnemonics/RELT)  ·  [EVID](/mnemonics/EVID)  ·  [PATH](/mnemonics/PATH)  ·  [SCN](/mnemonics/SCN)  ·  [CUST](/mnemonics/CUST)  ·  [OUT](/mnemonics/OUT)

---

::: tip
Press **F2** while in this panel to see all related functions in the MENU overlay.
Use **Ctrl+K** to search all 2,900+ functions by keyword.
:::
