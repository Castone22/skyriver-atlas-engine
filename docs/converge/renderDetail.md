# renderDetail

One function, `engine/functions/renderDetail.js`.

- The panel shown when no system is selected is the hook `regionOverview()`, defined in each atlas's
  `runtime-0.js`. Its text, buttons and statistics are the atlas's own.
- `nationNoun` (slot) names the nation in the widget's aria label; `regionSystemLabel` (slot) is the
  dossier's status line for a system in a region.
- Hooks that an atlas may leave undefined are called only when they exist: `greatBlinkFrame`,
  `cloakDecoration`, `cloakBadge`, `applyPlanetTitles`, `planetNameMarkup`, `regionSystemSummary`
  (otherwise `systemView`).
- The coordinates note reads `chartPositions` on the region, then `file`. Kadaym sets
  `chartPositions: true` on every region except Narthezk.
- A station with `schematic: "foundry"` gets a button labelled by the slot `schematicOpenLabel`; a TORA
  station gets "Open station overview ↗".
- Flag `widgetStationOverview` (Elysian): a station overview opens inside the widget.
- `regionSystemSummary` has two implementations, `-panel` (Calidor) and `-entry` (UACS).
