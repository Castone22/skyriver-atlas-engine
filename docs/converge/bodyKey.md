# bodyKey

Converged to `engine/functions/bodyKey.js` (was four variants), built from Elysian's.

| Difference | Variants | Resolution |
| --- | --- | --- |
| Inspect button labels use the synced planet title | UACS | **Flag** `inspectLabelsUseTitles` (on for UACS). |
| A world without an orbit slot shows `schematic orbit N` (from `layoutSlot` or `diagramSlot`) instead of `orbit unspecified` | Elysian | **Flag** `worldKeySchematicOrbit` (on for Elysian). Not data-gated: Elysian's worlds have `diagramSlot`, but other atlases may too. |
| A station gets a "Station overview" link and `data-tora` | Elysian: stations with a schematic; UACS, IULR, Calidor: `category === 'TORA'`; Kadaym: never | **Hook** `stationHasOverview(b)`: `stationHasOverview-schematic` (Elysian) and `stationHasOverview-tora` (the other four; Kadaym has no TORA stations so its behaviour is unchanged). |

Whitespace between attributes differs where a conditional attribute is empty. The golden tours
compare the serialised DOM, which normalises it, so nothing observable changes.

No questions.
