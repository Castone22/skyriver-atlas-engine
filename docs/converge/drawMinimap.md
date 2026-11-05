# drawMinimap

Converged to `engine/functions/drawMinimap.js` (2 variants -> 1).

| Difference | Resolution |
| --- | --- |
| IULR draws each region as an SVG `path` from `regionPath(r)` (outlines stored relative to the region's `bounds`), at opacity .23. The others draw an absolute `polygon` from the outline (opacity .16) or a rounded `rect` from `bounds` when there is no outline (.13). | Flag `minimapRegionPaths` (default off). IULR on. |
| IULR has no `atlasExtent`, so its minimap uses a fixed viewBox `0 0 2850 2570`; the others use `DATA.atlasExtent`. | Flag `minimapViewBox` (default null = use `atlasExtent`). IULR sets the string. The number lives in the bundle, not in shared code. |

Remaining: nothing. Questions: IULR's regions store outlines relative to `bounds` while the other
four store absolute points. Converting IULR's data to absolute points (and giving it an
`atlasExtent`) would remove both flags, but it changes the data contract that other IULR functions
(`draw`, `regionPath`) rely on, so it is left for a decision.
