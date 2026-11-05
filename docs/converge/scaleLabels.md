# scaleLabels

Partly converged: `engine/functions/scaleLabels.js` serves Calidor, Elysian, UACS and Kadaym
(4 variants -> 1). IULR keeps `scaleLabels-5982cc7d7bb0`.

The node-label block (system names and world names scaled and faded by zoom) was the same in the four
once its numbers are data, so it is shared. What each atlas does to its region labels differs, and
follows the same scheme as `draw`, so the existing flag `regionLabelStyle` selects it:

| `regionLabelStyle` | Atlas | Region label scaling |
| --- | --- | --- |
| `ink` (default) | Elysian | ink labels follow the labels checkbox; size `min(84, max(24, 12u))`; faded by whether it is the selected region |
| `ink-title` | Calidor | ink shown outside overview, title shown in overview (size from zoom), each faded by selection |
| `title-subtitle-ink` | UACS | ink shown with a region selected unless "wide"; title and subtitle shown when wide (overview and zoomed out) |
| `title-subtitle-extent` | Kadaym | decided from the atlas extent; title and subtitle sizes by overview; also shows or hides `#neighborLabel` |

Node-label numbers moved to data (`policies.labels`):
- `nodeScale: [near, far]` is the label scale at narrow (<= 700px) and wide screens: `[0.78, 0.88]`
  for Elysian and UACS, `[0.66, 0.78]` for Calidor and Kadaym.
- Kadaym's thresholds and `fixed`/`otherRegion`, as described in `labelThresholds.md`.

## Remaining (IULR)

IULR's `scaleLabels` is a different algorithm: it finds each label's system record and compares its
region to `highlightedRegion` (a state variable the other atlases do not have), uses
`labelThresholds(active)` pairs, scales by `max(vb.w/box.width, vb.h/box.height)`, hides individual
`.world-label`s, fades with 0.34, updates `.region-inscription`, and writes a `zoomLabel` tooltip.

## Questions

IULR's `highlightedRegion` (a region can be highlighted while the chart view stays on the whole atlas)
looks like a capability the others lack rather than a bug fix, and it also shapes `select`,
`setSystemFocus`, `restoreRoute` and `routeURL` (other batches). Converging IULR here would mean a
`highlightRegion` capability flag on all atlases. Not done: it needs the cross-batch decision.
