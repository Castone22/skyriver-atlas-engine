# zoom

Converged to `engine/functions/zoom.js` for the five stellar atlases (4 variants -> 1 plus the
Mahanzk variant, which is a geographic atlas outside this batch and keeps its own `zoom`).

The variants differed only in the limits placed on the map width, so the limits are now data:
`policies.zoom` in each `atlas.json`.

| Field | Meaning | Calidor, Elysian, UACS | Kadaym | IULR |
| --- | --- | --- | --- | --- |
| `minWidth` | narrowest allowed width | 260 | 260 | 260 |
| `minDivisor` | also allow `baseWidth / minDivisor` as a lower floor (smaller of the two) | 8 | 5 | none |
| `minDivisorOverviewOnly` | apply that floor only in overview mode | no | yes | no |
| `maxWidth` | widest allowed width | 9000 | 9000 | 9000 |
| `maxBaseMultiple` | also allow `baseWidth * n` as a higher ceiling (larger of the two) | 4 | none | none |

Remaining: nothing. Questions: none. Note for DSL atlases: they inherit the policy of the renderer
bundle they name, as with `policies.labels`.
