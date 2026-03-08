# Module Migration Checklist

Each module undergoing migration must meet these criteria:

- [ ] 10-second decision test passes
- [ ] Band limits respected (Primary 6, Secondary 8, Tertiary 8)
- [ ] No chart dominance
- [ ] No random visuals
- [ ] Deep detail collapsed
- [ ] No layout drift tokens (no `max-w-*`, `mx-auto`, etc.)
- [ ] Module must declare `decisionPrompt`
- [ ] Module provides a unified data model (`buildModel(context)`)
- [ ] Produces typed panels within band limits
- [ ] No chart-only generators (charts use module data model)
- [ ] Returns `primaryPanels`, `secondaryPanels`, `tertiaryPanels` from `render(model)`
