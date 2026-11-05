# textSVG

Converged to `engine/functions/textSVG.js` (2 variants -> 1).

| Difference | Resolution |
| --- | --- |
| UACS passes the text through `planetName()` so a planet's synced article title shows; the other four write it as given. | Flag `svgTextSyncedTitles` (default off). UACS sets it on in `bundle.json`. |

Caution for anyone converging nearby functions: the page already has a global `flags` (the
federation/context/hazard filter state). Always read capability flags as `__ATLAS__.flags.name`; do
not alias `__ATLAS__.flags` to a local named `flags`, which would shadow the filter state.

Remaining: nothing. Questions: none.
