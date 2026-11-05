# syncPlanetTitles

**Left (two variants), by design.** These are the title-sync engines themselves, not variants of one
function.

- **Elysian** keys by catalogue key over `DATA.worlds`: it batches 40 keys, queries the wiki by page
  id for known pages and by `articleTitle` for new ones, and stores into `planetArticles` through
  `acceptPlanetTitleBatch`, persisting with `savePlanetArticles`.
- **UACS** keeps `planetTitles` records (title, seed, aliases, page id), queries with
  `planetTitleAPI` and `resolvedPlanetPage`, and stores through `acceptPlanetPage` with
  `savePlanetTitles`.

They differ in state model, persistence format, refresh cadence (`force` window of 60 s against 3 s
and `planetTitleChecked` against `planetTitleCheckedAt`) and the post-sync UI hook. IULR has a third
engine (`syncPlanetArticleTitles`) outside this group. Converging them is a rewrite of the feature
around one store and would change cache keys and timing, so it is not done here.

No flags. No questions.
