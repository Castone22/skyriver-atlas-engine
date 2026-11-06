# regionHighlight

`regionHighlight` used to gate several unrelated IULR behaviours at once. It now keeps only its core
meaning: the page tracks a highlighted region as `highlightedRegion`, and `setView` uses the
highlight-mode form (no overview chart, `updateRegionDisplay()` on change). It is still on for IULR
only.

Every other behaviour that it gated has its own flag, named for the behaviour. Each flag defaults to
off, so every other atlas renders as before. IULR turns all of them on in `bundles/iulr/bundle.json`,
so IULR behaves exactly as before.

## New flags

| Flag | Behaviour when on (IULR) | Used in |
| --- | --- | --- |
| `hashIgnoredWithRegion` | The URL hash is ignored when the address names an explicit region and no system or planet. | `restoreRoute` |
| `noOverviewRoute` | The `chart` parameter is not read for routing; a region in the address opens its regional chart, never the overview chart. | `restoreRoute` |
| `addressRegionWins` | The region named in the address is used before the system's region (otherwise after it). | `restoreRoute` |
| `focusRegionIgnoresRegion` | On a `focus=region` route the address region is ignored and the system's region is used. | `restoreRoute` |
| `noLocalChartFallback` | An exact system and planet route does not fall back to the planet's local chart parent. | `restoreRoute` (two places) |
| `highlightRouteParam` | The address writes `highlight=<region>` and never `chart=`; restoring reads `highlight`. | `restoreRoute`, `routeURL` (two places) |
| `highlightedRegionState` | The saved history state and the remembered camera store `highlightedRegion` instead of the overview flag. | `restoreRoute`, `routeSnapshot`, `select`, `setSystemFocus` (two places) |
| `selectKeepsRegion` | Selecting or opening a system keeps the chart on the region the user chose instead of switching to the system's region. | `select`, `setSystemFocus` |

## Still under `regionHighlight`

| Use | Function | Why it stays |
| --- | --- | --- |
| Highlight-mode `setView(region, true)` call shape (no overview argument) | `restoreRoute`, `setSystemFocus` | Selects the highlight-mode form of `setView`, which ignores the overview argument anyway. |
| `updateRegionDisplay()` and `scaleLabels()` after a restore | `restoreRoute` | Refresh the highlighted-region display. |
| `updateRegionDisplay()` after restoring a remembered camera | `setSystemFocus` | Refreshes the highlighted-region display. |
| The whole highlight-mode branch of `setView` | `setView` | The core meaning: region is highlighted, no overview chart. |

## Notes

- The split is behaviour-preserving: with every flag set as in `bundles/iulr/bundle.json` each code
  path is the one IULR took before, and with all flags off each path is the one the other atlases take.
- `highlightRouteParam` also gates the write of `chart=` in `routeURL`, because the two are the same
  choice: `highlight=` on one side, `chart=` on the other.
- `highlightedRegionState` gates both the write and the read of the saved `highlightedRegion`, so
  history entries written by IULR still restore.
- The tours do not cover history state, hash routes or widget mode. These paths are verified by
  reading the code.
