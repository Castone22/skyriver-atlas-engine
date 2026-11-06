# labelThresholds and scaleLabels

Both functions serve every stellar atlas.

Flag `perSystemLabels` (IULR) selects the per-system scheme: each system label is compared with the
highlighted region, `labelThresholds(active)` returns a `[system name %, planet label %]` pair from
`policies.labels.levels`, scaled by `520 / min(width, height)`, and the zoom label's tooltip lists the
levels. Without the flag, `policies.labels` has the shape `{ fixed?, nodeScale, overview, regional }`
and `regionLabelStyle` chooses how region labels scale (see `scaleLabels` in the source).
