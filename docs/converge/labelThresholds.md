# labelThresholds

Partly converged: `engine/functions/labelThresholds.js` serves Calidor, Elysian and UACS (it already
did, as `labelThresholds-shared`) and now Kadaym. IULR keeps its own variant. Done together with
`scaleLabels`, its only caller; see `scaleLabels.md`.

| Difference | Resolution |
| --- | --- |
| Kadaym had no `labelThresholds`; its numbers were hard-coded in `scaleLabels` and not scaled by the viewport. | Kadaym's numbers are now `policies.labels` in its `atlas.json`, with `fixed: true` so no viewport factor is applied (the factor is otherwise `max(1, 640/width, 360/height)`). |
| Kadaym's planet threshold for non-highlighted systems is 495 in overview with no region selected but 332 with a region selected. | An optional `otherRegion` level in the overview policy, used by `scaleLabels` when a region is selected. |

Policy shape: `{ fixed?, nodeScale: [near, far], overview: {active, other, otherRegion?}, regional: {active, other} }`
where each level is `[system name %, planet label %]`.

## Remaining (IULR)

IULR keeps `labelThresholds-e09969274c09`. It differs in kind, not just in numbers:
- takes `active` and returns one `[names, planets]` pair, not an object with `active` and `other`;
- chooses the mode from `view === 'all'`, not `overviewMode`;
- reads the numbers from a `LABEL_ZOOM` constant in its runtime (keys `active` / `neighbor`);
- scales by `520 / min(width, height)`.

Converging it means deciding whether IULR adopts `overviewMode` and the object shape, which is tied to
its `highlightedRegion` state model (see `scaleLabels.md`, Questions). The compiler's `labelThresholds`
override for `features.labels` already special-cases IULR's shape (`labelThresholdsByLevel`).
