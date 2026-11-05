# highlightPart

Variants merged: elysian, calidor+iulr+uacs (2 -> 1). Result: converged, no flags.

| Difference | Resolution |
| --- | --- |
| The others pick the parts list inline (`selectedWorld==='Foundry'?foundryParts:toraParts`); Elysian asks `currentStationParts()` | The converged function always calls `currentStationParts()`. That helper (previously Elysian-only) now also returns `foundryParts` for the Foundry, then `triadParts` for a Triad station, else `toraParts`. The branch for a list an atlas does not define is never taken, so a missing `foundryParts` or `triadParts` is never read. |
| Filter id: the others use `#foundryAmber` for the Foundry and `#toraAmber` otherwise; Elysian always `#toraAmber` | Foundry filter for the Foundry, `toraAmber` for everything else. Elysian has no Foundry. |
| The others store `stationPart=index`; Elysian does not | Always store it (declared in every atlas). |

The Foundry is still identified by its name (`selectedWorld==='Foundry'`); see `openStation.md`.

## Questions

None.
