# setSystemFocus

Variants merged: calidor+elysian+uacs, kadaym, iulr (3 -> 1). Result: converged, flags
`regionHighlight` and `overviewStateKey`.

| Difference | Atlas | Resolution |
| --- | --- | --- |
| Opening a system first switches to its region unless the overview is on | Calidor, Elysian, UACS, Kadaym | Done when `regionHighlight` is off. IULR never switched view here. |
| The remembered camera stores the overview flag | Calidor, Elysian, UACS (`overviewMode`), Kadaym (`federationOverview`) | Stored under the key named by `overviewStateKey`. |
| The remembered camera stores `highlightedRegion` and, on return, restores it (falling back to the view's region) then calls `updateRegionDisplay()` | IULR | `regionHighlight` |
| `stationOverview=false` on every call | all but Kadaym | Always done; Kadaym declares the variable (`syncSystemFocus`) and never sets it. |

Each branch reads only the variable its atlas has (`overviewMode`, or `highlightedRegion` under
`regionHighlight`), and `updateRegionDisplay` is only linked and called in IULR.

## Questions

None.
