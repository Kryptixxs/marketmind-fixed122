# Terminal Density Rules

No panel may contain unused vertical space unless content is logically exhausted.

## Layout

- **Panels**: Use `min-h-0 flex flex-col` (or `h-full flex flex-col` at root). Avoid fixed heights.
- **Scroll areas**: Use `flex-1 min-h-0 overflow-y-auto` for content that may exceed viewport.
- **Data tables**: No `max-h-[Npx]`; use `overflow-auto` instead.
- **Lists**: No `.slice(0, N)` for scrollable lists; use high cap (80) or show all. Let scroll handle overflow.

## Data Volume

- Depth ladder, tape, feed, cross-asset matrix: render all available data; scroll when needed.
- Simulator generates sufficient volume (32 order book levels, 80 tape buffer, 48 headlines, 80 system feed).
- Add filler micro-metrics to shallow modules (RISK SNAPSHOT, analytics stack) so blocks have 8–12 rows.

## Grid Layouts

- Percentage grids (`grid-rows-[62%_38%]`) are acceptable for splitting regions.
- Internal content must use `flex-1 overflow-y-auto` so it fills and scrolls within its region.
- Avoid fixed row heights that create dead space when container grows.
