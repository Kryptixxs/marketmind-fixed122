# Terminal Constitution — Enforced Rules

## Visual Rules
- No cards, rounded corners, shadows, gradients, or "dashboard" spacing. Sharp 90° corners only.
- Background: #000. Base text: #e6e6e6. Dim text: #93a9c6. Borders: #111 (grid) / #222 (divider).
- Accent palette: green #00c853, red #d32f2f, cyan #63c8ff, amber #FFB000, white #fff.
- Monospace only. Default 10–11px. Headers 9–10px. Micro 8–9px. `tabular-nums` for all numeric columns.
- Padding: 2px default, 4px max. Row height: 16–18px.
- No responsive wrapping. Clip or scroll inside panel body.
- Page scrolling forbidden. Only panel bodies scroll.
- Empty areas must never exist. Show placeholder content + hints, never blank black space.

## Architectural Rules
- Every screen is a FUNCTION (mnemonic) rendered inside one of up to FOUR independent PANELs.
- Navigation is command-line + GO. No page routes. No browser-style navigation.
- Clicking a ticker nests within the same panel (pushes history), never routes globally.
- Each panel has its own security context, mnemonic, history stack, and link group.
- Functions are registered in MnemonicRegistry and rendered via FunctionRouter.
- No component may use `rounded-lg`, `shadow`, `bg-slate-*`, `max-w-*`, or centering wrappers.

## Density Tokens (from layoutDensity.ts)
All layout measurements come from the shared constant file.
Components must import tokens rather than hardcoding pixel values.
