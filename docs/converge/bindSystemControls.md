# bindSystemControls

Variants merged: elysian, calidor, iulr+uacs, kadaym (4 -> 1). Result: converged, one flag.

Kadaym's version is the plain controls; the other three add the station screen. The converged
function is the station-aware form with Calidor's Foundry button, and Kadaym's controls are the
part that always runs.

| Difference | Resolution |
| --- | --- |
| Kadaym has no station-screen block, no `.tora-register-link` / `[data-tora-open]` handlers, and plain `[data-world]` / `[data-station-filter]` handlers | All of that is guarded by state or elements Kadaym never has (`stationOverview` is always false there, and its markup has no `data-tora`, TORA filter or register links), so it is inert. `bindToraControl`, `bindToraName`, `closeStation` and `openStation` are only referenced inside those guards. |
| Calidor binds `[data-foundry-open]` to open the Foundry | Included for everyone: the element exists only in Calidor's markup. |
| Elysian returns early when `widgetMode` is set inside the station block; IULR/UACS/Calidor do not | The return is kept for all. It can only be reached when `stationOverview` is set in widget mode. `openStation` refuses in widget mode, and the `restoreRoute` of Calidor, IULR and UACS all start the check with `!widgetMode&&`; only Elysian's does not. So the return can only ever fire for Elysian, exactly as before. |
| Calidor re-highlights the part it had selected (`highlightPart(stationPart)`); the others always reset to the first part (`highlightPart(0)`) | Flag `keepStationPart` (Calidor on). |

## Questions

- None. (The golden tours do not exercise widget mode, so the widget-mode reasoning above rests on
  reading `restoreRoute`, not on a tour.)
