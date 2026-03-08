# GLOBAL TERMINAL SYSTEM RULES - NON-NEGOTIABLE

These rules apply to all modules, panels, charts, and layout systems across the entire application.

No component may violate these rules.

## RULE 1 - TASK-FIRST DESIGN

Every module must answer a primary question.

Before rendering any panel or chart:

- Identify the module's primary objective.
- Prioritize UI around that objective.
- Remove anything that does not directly support that objective.

No decorative visuals.
No density for density's sake.
No data walls.

## RULE 2 - INFORMATION HIERARCHY IS MANDATORY

Every screen must have:

- Primary band (most important)
- Secondary band (contextual support)
- Tertiary band (deep detail)

Nothing may have equal visual weight by default.

If everything is loud, nothing is useful.

## RULE 3 - NO RANDOM CHARTS

Charts must:

- Consume the same data model used by the module rows.
- Directly answer a specific question.
- Be explainable in one sentence.

If a chart cannot be justified, remove it.

No placeholder oscillators.
No decorative sine waves.
No generic time-series fillers.

## RULE 4 - SPACE IS PRECIOUS

The following are forbidden globally:

- max-width containers
- mx-auto wrappers
- centered layouts
- oversized headers
- excessive vertical padding
- card-style spacing
- empty dark zones

All containers must use:

`flex-1 w-full min-w-0 min-h-0`

No whitespace dead zones.

## RULE 5 - CHART PROPORTION CONTROL

Charts must:

- Never dominate the screen.
- Occupy proportional space relative to importance.
- Default to compact height.
- Avoid zoomed single-series focus.
- Use normalized comparison when possible.

Oversized plots are forbidden unless the function is explicitly chart-centric.

## RULE 6 - CONSISTENT DENSITY SCALE

Enforce a global density system:

- Fixed row height scale.
- Fixed header height scale.
- Fixed border tone.
- Fixed spacing increments.
- Fixed typography scale.

No module may define its own spacing logic.

## RULE 7 - ONE DATA MODEL PER MODULE

Each module must expose:

`ModuleDataModel`
`-> Table representation`
`-> Chart representation`

No independent chart data generators.
No mock arrays separate from visible metrics.

Semantic consistency is mandatory.

## RULE 8 - COLLAPSIBLE DEPTH

Advanced detail must:

- Be hidden by default.
- Expand on demand.
- Not overwhelm primary workflow.

Default screens must show what matters most right now.

## RULE 9 - KEYBOARD-FIRST BEHAVIOR

All modules must:

- Respect command context.
- Respond to global symbol changes.
- Avoid local state isolation.
- Not rely on mouse-only actions.

Terminal logic first.

## RULE 10 - REMOVE WEB APP DNA

Globally eliminate:

- Card UI patterns
- Hover glow animations
- Soft shadows
- Rounded corners
- Modern dashboard visual language
- Page-like navigation feel

This is a terminal system, not a SaaS analytics app.

## RULE 11 - NO PANEL REPETITION

If two modules share identical structure:

One of them is wrong.

Each function must feel distinct in layout and purpose.

No cloned grid templates across functions.

## RULE 12 - PERFORMANCE STABILITY

Charts and streaming updates must:

- Be memoized.
- Avoid unnecessary rerenders.
- Avoid animation loops.
- Avoid layout thrashing.

The terminal must feel stable under load.

## RULE 13 - SIGNAL GREATER THAN DECORATION

Visual emphasis must only represent:

- Risk
- Regime
- Exposure
- Flow
- Alert state

Never aesthetics.

## RULE 14 - REGRESSION PREVENTION

After any module refactor:

- Audit for whitespace drift.
- Audit for rogue padding.
- Audit for duplicate charts.
- Audit for semantic mismatch.
- Audit for visual dominance imbalance.

Continue correcting until compliance is restored.

## FINAL PRINCIPLE

The application must feel:

- Structured
- Intentional
- Hierarchical
- Task-driven
- Cohesive
- Institutional

If any screen feels chaotic, decorative, or dashboard-like, it violates the constitution.
