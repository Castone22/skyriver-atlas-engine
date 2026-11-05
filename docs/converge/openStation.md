# openStation

Variants merged: elysian, calidor+iulr+uacs (2 -> 1). Result: converged, no flags.

| Difference | Resolution |
| --- | --- |
| Elysian asks the `hasStationSchematic(b)` helper; the others test `b.category==='TORA'\|\|b.name==='Foundry'` inline | The converged function always calls `hasStationSchematic`. That helper (previously Elysian-only) now covers all three schematic kinds: `category==='TORA'`, `schematic==='triad'` and the station named `Foundry`. The other atlases link it. On the existing data no atlas gains or loses a schematic station (only Elysian has a `triad`, only Calidor a `Foundry`, only IULR `TORA` stations). |
| The others reset `stationPart=0` when a station opens; Elysian does not | Always reset it. Elysian declares `stationPart` now (it was an implicit global elsewhere). The value is only read by Calidor's Foundry/TORA part highlight. |

## Left in code

The station name `Foundry` is still tested by name (here and in `stationScreen`, `highlightPart`,
`currentStationParts`, `chooseSystemWorld`, `mountSystem` and others). Moving it to station data
(`schematic:'foundry'`) would also change Grand's search entries, which turn a station's `schematic`
into a route parameter, so it needs a change coordinated with Grand.

## Questions

None.
