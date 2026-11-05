# select

Variants merged: calidor, kadaym, elysian+uacs, iulr (4 -> 1). Result: converged, flags
`regionHighlight`, `overviewStateKey` (shared), `selectFirstWorld`, `closeSidebarOnSelect`.

| Difference | Atlas | Resolution |
| --- | --- | --- |
| Selecting a system first switches to its region unless the overview is on (twice: on select and when a local chart parent is found) | Calidor, Elysian, UACS, Kadaym | Skipped under `regionHighlight`; IULR never switched view here. |
| The remembered camera stores the overview flag (`overviewMode`, or `federationOverview` for Kadaym) or, in IULR, `highlightedRegion` | all | `overviewStateKey` / `regionHighlight` |
| With no named object, the first catalogued world is selected | Elysian, UACS, Kadaym, IULR (not Calidor) | `selectFirstWorld` |
| Selecting closes the mobile index drawer (`#sidebar` loses `open`) | Kadaym, IULR | `closeSidebarOnSelect` |
| `stationOverview=false` on every call | all but Kadaym | Always done (Kadaym declares the variable and never sets it) |

## Questions

- Kadaym and IULR close the mobile drawer on selection and Calidor, Elysian and UACS do not; the
  other three never get the drawer closed when a system is chosen from the list on a phone. That reads
  like a fix that was not carried over, but it is a visible behaviour (and the tours run at desktop
  width), so it is preserved behind `closeSidebarOnSelect`. Needs a decision.
- Calidor does not select a default world when none is named; the other four do. Preserved behind
  `selectFirstWorld`.
