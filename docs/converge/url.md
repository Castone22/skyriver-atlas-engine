# url

Variants merged: kadaym, iulr, calidor+uacs, elysian (4 -> 1). Result: converged, three flags.

The base (Calidor/UACS) builds `title=<name with underscores>` from the reference target, the
`titles` map, or `canonicalTitle(name)`. Each other variant adds one capability:

| Capability | Atlas | Flag (default off) |
| --- | --- | --- |
| Straighten curly apostrophes (`’` `‘`) in the title before the URL is built | Kadaym | `normalizeTitleApostrophes` |
| Planets use the synchronised article title (`planetArticleName`) when `DATA.worlds` has them | IULR | `planetArticleTitles` |
| Planets link by Codex page id (`index.php?curid=`) once `planetArticles[key].pageid` is known | Elysian | `planetPageLinks` |

`planetKey`, `planetArticles` and `planetArticleName` exist only in the atlases that turn their flag
on, and are only referenced behind the flag, so the others never evaluate them.

## Questions

- Kadaym straightens curly apostrophes and the others do not, so a title such as `Circa’s Triad`
  links to `Circa’s_Triad` in Elysian but would link to `Circa's_Triad` in Kadaym. This looks like a
  fix that never reached the other atlases (MediaWiki titles normally use the straight form). Kept
  as it is; turning the flag on elsewhere would change those atlases' links. Needs a decision.
