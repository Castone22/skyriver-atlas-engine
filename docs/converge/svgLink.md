# svgLink

Converged to `engine/functions/svgLink.js` (3 variants -> 1).

| Difference | Resolution |
| --- | --- |
| Elysian marks planet links with `data-planet-link` on the anchor and `data-planet-title` on the text (when the name is a catalogued world) so the page can find and retitle them. | Flag `planetLinkAttributes` (default off). Elysian on. |
| Elysian shows the synced title whenever the label equals the name; IULR only when the name is also a catalogued world; the others never. | Flag `linkTitleSync`: `"off"` (default), `"worlds"` (IULR), `"all"` (Elysian). Kept as two modes because `planetName` can differ from the name for a non-world whose name matches a world's article title, so the modes are not provably equal. |

Calidor, Kadaym and UACS keep the plain behaviour (UACS gets its synced titles inside `textSVG`, see
`textSVG.md`).

Remaining: nothing. Questions: whether Elysian's `all` and IULR's `worlds` are meant to differ. They
are kept as written; collapsing them to one mode would need a decision.

Superseded in part: the flags described here are removed. Every atlas now looks planet names up from the wiki the same way; see `title-sync.md`.
