# draw

Partly converged: `engine/functions/draw.js` now serves Elysian, Calidor and UACS (3 variants -> 1).
IULR (`draw-ab708dae8498`) and Kadaym (`draw-b185cff73a7a`) keep their own variants; see "Remaining".

## Converged for Elysian, Calidor and UACS

| Difference | Resolution |
| --- | --- |
| Starfield bounds: Elysian and UACS use a fixed box, Calidor derives it from `atlasExtent`. | `policies.draw.backdrop` = `{x, y, w, h}`, or `null` to use `atlasExtent`. The arithmetic is unchanged: `-1000 + rand()*6500` is the same float as `rand()*6500 - 1000`. |
| The system drawn as the featured gold star was named in code (`Forge`, `Calidor`, `Sol`). | `policies.draw.featuredSystem` holds the name; the code no longer names a system. |
| Which field lists a system's world labels, and whether that list or `worlds` decides if the group is drawn (Elysian `overviewWorlds`, UACS `mapWorlds`, Calidor `worlds`). | `policies.draw.worldListField` and `policies.draw.worldListGatesLabel`. |
| Region labels: Elysian one ink label with a font size; Calidor ink (no font size) plus a title; UACS a linked title, a subtitle and a linked ink label. | Flag `regionLabelStyle`: `"ink"` (default), `"ink-title"`, `"title-subtitle-ink"`. Attribute order is preserved, since the tours hash it. |
| Calidor draws companion stars (`primaries` after the first). Every atlas has `primaries` data, so this cannot be data-driven. | Flag `companionStars`. Calidor on. |
| UACS adds a tooltip to each star. | Flag `starTooltips`. UACS on. |

## Remaining (IULR and Kadaym keep their own `draw`)

Both have content and design written into the function, so converging needs data moved first.

IULR:
- Region outlines are stored relative to `bounds` and drawn through `regionPath(r)`; the others store absolute points. The region path also has a different element set (`tabindex`/`role`/`aria-pressed`, a dashed `region-shroud` path, a `data-region-contamination` hatch, a `region-inscription` label, `labelPosition` instead of `labelAnchor`, `highlightRegion(key)` instead of `setView`).
- No `neighborLabel` group; `hexLayer` has no `pointer-events`.
- Star targets use `s.worlds.map(planetName)` in the aria-label, a `s.cloaked` ring, `s.isCapitalSystem` for the featured star, and `s.namedWorlds` (at most two, at fixed offsets).

Kadaym:
- Regions with no `outline` get a hand-written curved path chosen by region key (`narthezk` and a default), computed from `bounds`.
- A region `watermarkAnchor`, a quarantine ellipse with a linked label for `cordon` regions, a linked title and a subtitle whose text is special-cased for `frontier` and `narthezk` (the latter counts systems).
- A hand-placed "spinward neighbour" annotation: arrow path, a link to the IULR article and coordinates.
- Featured star is `Virezk`.

To converge them: move the curved paths, the annotation and the special subtitles into `atlas.json`
data (region `path`, a `annotations` list, a `subtitleTemplate`), then add flags for the IULR region
element set. That changes data contracts used by other functions, so it is left for a decision.

Questions: none about behaviour differences. Naming: the featured-star field could live on the
system record (`featured: true`) instead of a policy name; kept as a policy to avoid touching system
records.
