# Terminal Platform Contracts

> Enforced rules for all screens in the MarketMind Terminal.  
> Any PR that violates these contracts should be blocked.

---

## 1. No Page Scroll — Root Overflow Hidden

**Rule:** The root workbench div (`NewTerminalWorkbench`) and the `NewPanelGrid` must have `overflow-hidden`. Scroll may only exist on designated panel body containers.

**Canonical scroll boundary:**
```
NewPanelFrame
  └── panel body div   → overflow:hidden, flex-1, min-h-0
        └── scroll wrapper  → overflow-auto, h-full, min-h-0   ← ONLY place scroll lives
              └── [mnemonic content]
              └── PanelFiller  (appended below short content)
```

**Violations:**
- Never add `overflow-auto` or `overflow-y-auto` to a mnemonic's **root** `flex flex-col` div.
- `FnMKT` was violating: root div had `overflow-auto` — this creates double-scroll inside the frame.
- `NestedModuleShell` (legacy): flex-1 child was missing `min-h-0` and had double scroll.

---

## 2. `min-h-0` / `min-w-0` Applied Correctly

**Rule:** Every `flex-1`, `flex-grow`, or `h-full` div that contains scrollable or growing content **must** carry `min-h-0`. In horizontal flex chains, `min-w-0` prevents blowout.

```tsx
// CORRECT
<div className="flex flex-col flex-1 min-h-0 overflow-hidden">
  <div className="flex-1 min-h-0 overflow-auto terminal-scrollbar">
    {content}
  </div>
</div>

// WRONG
<div className="flex flex-col flex-1">      ← missing min-h-0 → black void
```

**Check:** Any `flex flex-col` that holds a child with `flex-1` must itself have `min-h-0` if it is also a flex child.

---

## 3. Readability Tokens — Always Use `DENSITY`

**Rule:** Never use raw hex colors in component files. All colors, spacing, and font sizes must reference `DENSITY` from `constants/layoutDensity.ts`.

**Token reference:**

| Purpose | Token |
|---------|-------|
| Primary text | `DENSITY.textPrimary` |
| Secondary text | `DENSITY.textSecondary` |
| Dim/muted text | `DENSITY.textDim` |
| Background (base) | `DENSITY.bgBase` |
| Surface | `DENSITY.bgSurface` |
| Surface alt | `DENSITY.bgSurfaceAlt` |
| Panel bg | `DENSITY.panelBg` |
| Panel bg alt | `DENSITY.panelBgAlt` |
| Row zebra | `DENSITY.rowZebra` |
| Row hover | `DENSITY.rowHover` |
| Row selected bg | `DENSITY.rowSelectedBg` |
| Row selected marker | `DENSITY.rowSelectedMarker` |
| Group separator | `DENSITY.groupSeparator` |
| Border | `DENSITY.borderColor` |
| Grid line | `DENSITY.gridlineColor` |
| Amber accent | `DENSITY.accentAmber` |
| Cyan accent | `DENSITY.accentCyan` |
| Green accent | `DENSITY.accentGreen` |
| Red accent | `DENSITY.accentRed` |
| Font family | `DENSITY.fontFamily` |
| Font default | `DENSITY.fontSizeDefault` |
| Font header | `DENSITY.fontSizeHeader` |
| Font micro | `DENSITY.fontSizeMicro` |
| Font tiny | `DENSITY.fontSizeTiny` |

**For `input`/`select` elements, use the canonical style:**
```tsx
import { inputStyle } from 'src/features/terminal-next/constants/layoutDensity';
// or inline:
style={{ background: DENSITY.bgBase, border: `1px solid ${DENSITY.borderColor}`, color: DENSITY.textPrimary, fontSize: DENSITY.fontSizeTiny, fontFamily: DENSITY.fontFamily }}
```

**Banned raw values:** `#000`, `#111`, `#222`, `#0a0a0a`, `#060606`, `#090909`, `#1a2a3a`, `#93a9c6`, `#e6e6e6`, `#fff` (except intentional pure-white on amber backgrounds).

---

## 4. HELP / MENU / HL — Consistent Wiring

**Rule:** F1, F2, and Ctrl+K are panel-level keyboard contracts, wired through `NewPanelFrame` and `PanelCommandLine`.

| Key | Expected behavior |
|-----|-------------------|
| `F1` | `dispatch({ type: 'PRESS_HELP' })` → opens help/tutorial overlay |
| `F2` | `dispatch({ type: 'SET_OVERLAY', mode: 'menu' })` → opens MENU |
| `Ctrl+K` | `dispatch({ type: 'SET_OVERLAY', mode: 'search' })` → opens HL |
| `Esc` | Close any overlay, or clear command input |

**Note on DenseTable:** F2 inside a focused `DenseTable` opens the **row context menu** for the selected row, not the panel MENU. This is intentional — row-level F2 is higher-priority than panel-level MENU.

**Violation fixed:** `WakeUpScreen` `onKeyDown` was not propagating F1/F2/Ctrl+K — now falls through to the window handler in `NewPanelFrame`.

---

## 5. Entity Click Behavior — Central `drill()` API

**Rule:** All navigation from entity clicks must go through `drill(entity, intent, panelIdx)` from `useDrill()`. Do not call `navigatePanel()` directly from UI event handlers (except in OS-management panels like `FnPlatformOS`, `FnNAV`, `FnWave4Workflow` which manage workspace state explicitly).

| Mouse gesture | Intent |
|--------------|--------|
| Click | `OPEN_IN_PLACE` |
| Shift+Click | `OPEN_IN_NEW_PANE` |
| Alt+Click | `INSPECT_OVERLAY` |
| Right-click | Context menu via `openContextMenu()` |

**Import pattern:**
```tsx
const { drill } = useDrill();
// In onClick:
onClick={(e) => drill(entity, intentFromMouseEvent(e), panelIdx)}
onContextMenu={(e) => openContextMenu(e, entity, panelIdx)}
```

**Acceptable `navigatePanel()` direct calls:** `FnPlatformOS`, `FnWave4Workflow`, `FnNAV`, `PanelCommandLine` — these are workspace/session-management surfaces where the navigation intent is already determined.

---

## 6. No Dead Space — Auto-Filler Contract

**Rule:** If a mnemonic view does not fill its panel body, `PanelFiller` is appended automatically via `NewPanelFrame`. No mnemonic needs to implement its own filler logic.

**How it works:**
```
NewPanelFrame body scroll wrapper
  ├── [mnemonic content]
  └── PanelFiller (from fillers/PanelFillers.tsx)
        ├── MiniQuoteBlock    (if content < threshold)
        ├── MiniRelsBlock     (if not RELS mnemonic)
        ├── MiniKeyFields     (if not FLD mnemonic)
        ├── MiniNewsBlock     (if not TOP/CN mnemonic)
        └── MiniAlertsBlock   (if not ALRT mnemonic)
```

**Mnemonics must NOT add their own inline `EmptyFill` as a permanent fixture.** `EmptyFill` is only appropriate for empty states inside a list/table that is genuinely empty (e.g. "No orders in blotter").

**`HintStrip` is NOT part of `PanelFiller`.** The keyboard hint strip is rendered once in `NewPanelFrame.KeyboardHintStrip`. Mnemonics must not duplicate it.

---

## 7. Canonical Component Hierarchy

```
NewTerminalWorkbench          overflow:hidden, flex-col
  SystemStrip                 flex-none
  CommandStateStrip           flex-none (global command bar)
  NewPanelGrid                flex-1, min-h-0, overflow:hidden
    DockTree (recursive)
      NewPanelFrame           flex-col, min-h-0, overflow:hidden
        PanelHeader           flex-none
        PanelToolbar          flex-none
        BreadcrumbStrip       flex-none
        NextActionsStrip      flex-none
        KeyboardHintStrip     flex-none
        PanelCommandLine      flex-none
        ─── body ───          flex-1, min-h-0, overflow:hidden
          scroll wrapper      h-full, overflow-auto (ONLY scroll point)
            [MnemonicFn]      flex-col, h-full, min-h-0
            PanelFiller       flex-col (appended after short content)
          [Overlays]          absolute inset-0 z-30+
```

---

## Enforcement Checklist

Before merging any component:

- [ ] Root mnemonic div: `flex flex-col h-full min-h-0` — no `overflow-auto`
- [ ] All `flex-1` children inside `flex-col` parents: have `min-h-0`
- [ ] No hardcoded hex color (use `DENSITY.*`)
- [ ] No raw `background: '#000'` on inputs/selects (use `inputStyle` helper)
- [ ] F1/F2/Ctrl+K not overridden locally (unless documented exception)
- [ ] Entity clicks use `drill(entity, intentFromMouseEvent(e), panelIdx)`
- [ ] Right-click uses `openContextMenu(e, entity, panelIdx)`
- [ ] No custom filler logic — `PanelFiller` handles it
- [ ] `EmptyFill` used only for genuinely empty list states, not as a permanent fixture
