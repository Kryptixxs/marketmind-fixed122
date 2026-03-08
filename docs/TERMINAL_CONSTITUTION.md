# Terminal Constitution

## Objective
Transform the app from a panel collage into a terminal runtime with strict structural grammar. Modules become decision-first tools with enforced hierarchy, bounded visual complexity, and semantically grounded visuals.

## Non-negotiable Outcomes
1. **Single Primary Decision:** Every function has a single primary decision visible immediately.
2. **Enforced Proportions:** Every screen has enforced Primary / Secondary / Tertiary bands with fixed proportions.
3. **Governed Panels:** Panels are typed and governed (verdict, snapshot, diagnostic, flow, vulnerability, order_state, historical).
4. **Compact Charts:** Charts are compact, purposeful, and never dominate unless in a chart-specific function.
5. **Collapsed Detail:** Deep detail is collapsed by default.
6. **No Improvised Layout:** No module may improvise layout; modules declare intent and data models, runtime renders.

## Governance Rules
- Use CSS grid with fixed rows (e.g., `0.25fr 0.45fr 0.30fr`).
- Band containers enforce `flex-1 w-full min-w-0 min-h-0`.
- No `max-w-*`, `mx-auto`, or centered wrappers.
- Max panels per band (default): Primary 6, Secondary 8, Tertiary 8.
- Panels of type `HISTORICAL` default collapsed.
- Each panel declares `priority` and `minHeightUnits`.
- Charts must receive data from the module data model (no chart-only generators).
- One data model per module: both table rows and chart series derived from the same fields.
