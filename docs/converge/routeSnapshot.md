# routeSnapshot

Variants merged: calidor+elysian+uacs, kadaym, iulr (3 -> 1). Result: converged, three flags.

The snapshot is the object stored in the browser history entry. It is built from the shared fields
plus the atlas's overview state:

| State | Atlas | Flags |
| --- | --- | --- |
| `overviewMode` (boolean) | Calidor, Elysian, UACS | defaults |
| the same boolean under the key `federationOverview` | Kadaym | `overviewStateKey: "federationOverview"` (the key is kept so history entries written before this change still restore) |
| `highlightedRegion` instead of the overview boolean | IULR | `regionHighlight: true` |
| `stationOverview` | all but Kadaym | `stationRoute` set (`station` or `focus`) |

IULR copied `regionalCamera` field by field; the others spread it. The remembered camera has the same
fields in both, so one spread is equivalent.

The golden tours do not look at history state, so this group is verified by reading the code, not by
a tour.

## Questions

None.
