# MARKET Constitution Audit Checklist

Use this checklist after every MARKET refactor. A release is blocked until all checks pass.

## Layout and Whitespace

- [ ] No whitespace drift or dead zones across the three MARKET bands.
- [ ] No `max-width`, `mx-auto`, centered wrappers, or card-like spacing.
- [ ] All major containers use `flex-1 w-full min-w-0 min-h-0`.

## Hierarchy and Density

- [ ] Clear primary/secondary/tertiary information hierarchy is visible on first scan.
- [ ] Header heights, row heights, spacing, and border tones follow terminal density constants.
- [ ] No rogue one-off padding or spacing logic in MARKET components.

## Chart Governance

- [ ] Every chart maps to the same MARKET module data model used by rows.
- [ ] Every chart answers a single stated question.
- [ ] No duplicate charts or decorative placeholders.
- [ ] No oversized chart dominates the workspace by default.

## Semantics and Workflow

- [ ] Top band answers current regime state question.
- [ ] Middle band explains drivers.
- [ ] Bottom band shows flow and vulnerability.
- [ ] Deep detail layer is collapsed by default.

## Keyboard and Context

- [ ] Deep-detail toggle is available via keyboard.
- [ ] Band focus or context controls are keyboard accessible.
- [ ] MARKET reacts correctly to global symbol changes and command context.

## Performance and Stability

- [ ] Derived MARKET model and chart transforms are memoized.
- [ ] No unnecessary rerender loops when streams tick.
- [ ] No layout thrashing under sustained updates.
