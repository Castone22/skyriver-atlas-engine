# renderMapLegend

Converged to `engine/functions/renderMapLegend.js` (5 variants -> 1). The variants were almost
entirely content (legend colours and labels) written into code, so the content moved into each
atlas's data as `policies.legend`.

It is under `policies` (not `presentation`) because a DSL atlas inherits `policies` from the
renderer bundle it names, but not `presentation`; this keeps DSL atlases showing their renderer's
legend.

| Field | Meaning | Used by |
| --- | --- | --- |
| `entries` | `[colour, label]` pairs shown by default | all five |
| `regions` | per-region override: `{ regionKey: [[colour, label], ...] }` | Kadaym (`frontier`) |
| `tiers` | regions with `silentPresence` or `cordon` show the tier legend (`TIER_NAMES` / `TIER_COLORS` globals) | Kadaym |
| `overviewRegions` | on the whole-atlas view, list the regions (their colour and a link to each name) | IULR |
| `append` | pairs always added after the others | IULR (TORA shroud) |

Labels are HTML-escaped. None of the existing labels contain a character that escaping changes, so
the markup is identical to before.

Remaining: nothing. Questions: none. `link()` (used for IULR's region list) is itself a per-atlas
function defined in each runtime that differs by planet-title sync; it is outside this batch.
