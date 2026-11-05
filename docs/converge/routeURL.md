# routeURL

Variants merged: calidor+elysian+uacs, kadaym, iulr (3 -> 1). Result: converged, flags
`overviewChart`, `widgetKeepsAddress`, plus the shared `regionHighlight` and `stationRoute`.

The address-bar contract is public (wiki embeds and deep links use it), so each atlas keeps exactly
the parameters it wrote before, in the same order (the tours record `location.search`).

| Difference | Atlas | Resolution |
| --- | --- | --- |
| `chart=overview` against `chart=federation` | Kadaym uses `federation` | `overviewChart` (default `overview`, Kadaym `federation`) |
| Leave the address alone in widget mode when no system is open | Calidor, Elysian, UACS, Kadaym | `widgetKeepsAddress` (on for those four, off for IULR) |
| `station=1` for the station overview | Calidor, Elysian, UACS | `stationRoute: "station"` |
| `focus=station` for the station overview | IULR | `stationRoute: "focus"` |
| no station overview in the address | Kadaym | `stationRoute: ""` (default) |
| `highlight=<region>` and no `chart` parameter | IULR | `regionHighlight` |
| `system=<slug or id>` | IULR writes `record.slug\|\|record.id` | Used for all. Only one IULR system has a `slug`; no other atlas has any, so every other atlas still writes its `id`. |

The parameters cleared at the start differ by atlas for the same reason (`chart`/`station` against
`highlight`), so the clear list is built from the same flags. The order in which the parameters are
set is kept per atlas: IULR sets `focus=station` before `planet`, the others set `station=1` after it.

## Questions

- IULR rewrites the address in widget mode when no system is open; the other four leave it alone.
  That looks like an oversight rather than a design, but it is a behaviour (the widget URL changes as
  you pan), so it is preserved behind `widgetKeepsAddress`. Needs a decision whether IULR should
  keep its address too. The golden tours do not cover widget mode.
