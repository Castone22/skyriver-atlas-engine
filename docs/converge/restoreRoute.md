# restoreRoute

Variants merged: elysian, calidor, uacs, kadaym, iulr (5 -> 1). Result: converged, using the shared
flags `overviewChart`, `overviewStateKey`, `regionHighlight`, `stationRoute` and the new
`fallbackRegion` and `widgetStationOverview`.

Elysian's form is the base; the others differ as follows.

| Difference | Atlas | Resolution |
| --- | --- | --- |
| Overview chart address value `chart=federation` | Kadaym | `overviewChart` |
| Region used when the address names none: `makor` (Kadaym), `avendonraik` (IULR), otherwise `all` | Kadaym, IULR | `fallbackRegion` |
| Restoring a history entry reads the overview flag from `state.federationOverview` | Kadaym | `overviewStateKey` |
| No station overview from the address | Kadaym | `stationRoute: ""` (default) |
| Station overview from `station=1` or the saved state | Calidor, Elysian, UACS | `stationRoute: "station"` |
| Station overview from `focus=station`, and the saved state wins when there is one; `planetFocus` is cleared | IULR | `stationRoute: "focus"` |
| Station overview is refused in widget mode | Calidor, UACS, IULR (Elysian allows it) | `widgetStationOverview` (Elysian on) |
| Station test is `TORA` (UACS, IULR), `TORA` or `Foundry` (Calidor), `hasStationSchematic` (Elysian) | | Always `hasStationSchematic`, which covers all three (see `openStation.md`) |
| IULR's routing, all under `regionHighlight`: the hash fragment is ignored when an explicit region is given; the region wins over the system's region; no overview or regional-chart route; `setView(region, true)` with no overview argument; the planet focus on an exact route does not fall back to the local chart parent; a `highlight` parameter and the saved `highlightedRegion` are restored; `updateRegionDisplay()` and `scaleLabels()` run at the end | IULR | `regionHighlight` |

The tours cover address routes (region, overview chart, system, planet, object, station). They do not
cover restoring from saved history state, hash fragments, or widget mode, so those branches are
verified by reading the code.

## Questions

- The IULR routing differences under `regionHighlight` (hash ignored for an explicit region, no local
  chart parent on exact routes) may be oversights or deliberate design for that atlas's regions. They
  are preserved exactly. If the highlight capability is ever turned on for another atlas, these
  would be better split into their own flags.
- IULR lets the saved state decide whether the station overview is restored, while the others restore
  it if either the saved state or the address asks for it. Preserved behind `stationRoute: "focus"`.
