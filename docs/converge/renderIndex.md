# renderIndex

Converged to `engine/functions/renderIndex.js` for the five stellar atlases (was four variants; the
Grand atlas keeps its own `renderIndex`, which belongs to a different application).

| Difference | Variants | Resolution |
| --- | --- | --- |
| Which systems are listed | IULR lists the highlighted region when one is set | `typeof highlightedRegion !== 'undefined' && highlightedRegion ? … : …`. The `typeof` guard means no atlas needs to declare `highlightedRegion`; it only reads it where it exists. **Cross-batch:** once the routing batch declares `highlightedRegion` for every atlas, the `typeof` can go. |
| Which system sorts first | Elysian `Forge`, Kadaym slot `Virezk`, Calidor slot `Forge` (no such record), UACS literal `Forge` (no such record), IULR `isCapitalSystem` | **Data.** The converged sort reads `indexFirst` or `isCapitalSystem`. Elysian's `Forge` and Kadaym's `Virezk` systems carry `indexFirst: true`. A separate field is used on purpose: `isCapitalSystem` also makes IULR's `draw` paint a capital star, and Elysian/Kadaym must not gain that. The Calidor and UACS references were inert (no record has that name) and are dropped. The two slots `indexFirstSystem` and `indexHintAtlas` are removed. |
| Search-match line uses the display title | Elysian, UACS, IULR | `planetName` hook (identity for Calidor and Kadaym). |
| World list in a row | Elysian: links over `overviewWorlds`; Kadaym/Calidor: plain `s.worlds`; UACS: titles over `s.worlds`; IULR: titles over `s.namedWorlds` | **Flag** `indexWorldLinks` (Elysian on) for the link form; otherwise `(s.namedWorlds \|\| s.worlds).map(planetName)`. `namedWorlds` exists only in IULR's data, and the title hook is the identity elsewhere. |
| Empty-result hint | a different sentence per atlas | **Slot** `indexHint` (full sentence, per bundle). |

## Questions

- **Kadaym's empty-result hint names "Elysian Collective"** ("Try a name, Tier 5, Elysian Collective,
  ruins or magnetar."). That looks like a copy of Elysian's text. It was kept exactly; if it should
  say Kadaym, change the `indexHint` slot in `bundles/kadaym/bundle.json`.
- Calidor's old first-system slot named `Forge`, which does not exist in Calidor's data, and UACS has
  the same literal. Both look like leftovers from Elysian.

Superseded in part: the flags described here are removed. Every atlas now looks planet names up from the wiki the same way; see `title-sync.md`.
