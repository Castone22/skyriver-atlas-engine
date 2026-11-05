# updateVisibility

Converged to `engine/functions/updateVisibility.js` (4 variants -> 1).

| Difference | Resolution |
| --- | --- |
| Kadaym counts a system with a `cordon` field as a hazard. | Data-driven, unconditional: `s.cordon \|\| ...`. Only Kadaym's data has `cordon` (7 systems), so it is inert elsewhere. |
| Elysian hides "major only" systems by `s.overviewWorlds \|\| s.worlds`. | Data-driven, unconditional: only Elysian's data has `overviewWorlds` (all 66 systems), so it is inert elsewhere. |
| Kadaym does not reset every `.node-label` display from the labels checkbox before `scaleLabels()`. | Flag `visibilityResetsLabels` (default off). Calidor, Elysian, IULR and UACS on. The reset is overwritten by `scaleLabels()` unless the map has no width, which is the only case where Kadaym differs. |
| IULR toggles the `borders-hidden` class on the region layer; the others set its display style. | Flag `bordersToggleClass` (default off). IULR on. |

Remaining: nothing. Questions: whether Kadaym should also reset labels (the difference only shows
when the map has zero width); kept as it was.
