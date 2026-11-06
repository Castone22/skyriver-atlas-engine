# Planet title sync (decision 15)

## What it is for

Atlas data names a planet once, and that name is the planet's key in links (`planet=Varro III`), saved
routes and search. The wiki can rename an article, by a move with a redirect or without one. The atlas
asks the Codex API for the current title of each planet and shows that, while the key stays the same.

Three atlases do this, each with its own implementation. Decision 15: Elysian's becomes the one, and the
API address becomes a slot.

## The three implementations

| | Elysian | UACS | IULR |
| --- | --- | --- | --- |
| State | `DATA.planetArticles[key] = { title, pageid }` | `planetTitles` map: key to `{ seed, title, pageid, aliases[] }` | `planetArticleIDs` (name to page id) and `planetResolvedTitles` (name to title) |
| Seed title | `worlds[key].articleTitle`, else the key | `articleTitle`, else the key | `articleTitle`, else the name |
| Saved in localStorage as | `elysian-atlas-planet-articles-v1` | `skyriver-uacs-planet-titles-v1` (only if the saved seed still matches) | `skyriver-iulr-planet-articles-v1` |
| Lookup of a title | `planetKey(name)` finds the key from a name, the seed or the live title; `planetName(name)` | `planetTitleRecord(name)` matches the key, the title or any alias | `planetResolvedTitles.get(name)` |
| Old titles | not kept | kept as `aliases` (last 20) and searchable | not kept |
| Query | known page ids by `pageids`, new ones by title, redirects followed | known page ids first, then seed titles; refuses redirects that carry a fragment | known page ids first, then every title; a stable page id wins over a different article recreated at the old title |
| Batching | 40 per request, two workers in parallel | 40 per request, in sequence | chunks in parallel |
| Timeout | 12 s per request, then the last good title stays | 12 s | 12 s |
| Repeats | every 60 s while visible; also on focus and when back online; stopped while the tab is hidden | checks at start, on focus, online and when the tab becomes visible; every 60 s; throttled to 3 s (forced) or 60 s | every 180 s; forced on focus |
| After a change | saves, then patches the page in place (`applyPlanetTitles`): text, links, aria labels; restores the route if the address named a planet | saves, then redraws everything (`refreshPlanetTitleUI`), restoring scroll and focus | rebuilds the chart, labels, index and dossier |
| Links | `link()` writes `data-planet-link` and `data-planet-title`, so titles update without a redraw | titles resolved when drawn | titles resolved when drawn |
| API address | written into the code | written into the code | written into the code |

Shared by all three: only planets (`bodyType` World); an invalid or missing page is ignored; titles
fall back to the catalogue name offline; the request carries no credentials.

## What changes if Elysian's is the one

- UACS loses its alias list (searching an old title would no longer find the planet) unless it is carried
  over as a feature.
- IULR loses "a stable page id beats a recreated article at the old title" unless Elysian's page-id-first
  query already covers it.
- IULR's 180 s refresh becomes 60 s.
- UACS and IULR switch from redrawing to patching in place, so `link()`, `canonicalTitle` and `url()` in
  both runtimes must emit the same `data-planet-link` and `data-planet-title` attributes.
- Cache keys differ, so each atlas's saved titles are discarded once on first load after the change.
- The tests cannot see any of this: the browser tours block the network.

## Questions for Astra

1. Do page ids survive every kind of move on the wiki, including moves without a redirect? Is following
   the page id first always right?
2. If an old title is later recreated as a different article, which one should the atlas show?
3. Should old titles stay searchable (UACS does, the others do not)?
4. Do moons and stations get renamed on the wiki too? If so, title sync should cover every body, not only
   planets.
5. How often should the atlas ask, and is there a request limit we should respect? Is 60 s while visible
   too often when many readers have the page open?
6. Is `crossorigin=&maxage=0&smaxage=0` (a cache-bypassing query) acceptable for the wiki, and do embeds
   from other origins need an explicit allowed origin on the wiki side?
7. Is a redirect to a section (a fragment) ever a valid rename target? UACS rejects it.
8. What should the atlas show if the wiki returns a page that is not in the main namespace, or a
   disambiguation page?
9. What address should the engine use for the API: one per atlas (a slot), or one per engine?
