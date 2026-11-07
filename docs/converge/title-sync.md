# Planet names and the wiki

An atlas names a planet once. That name is the planet's key in links (`planet=`), saved routes and search,
and it never changes. What the atlas *shows* is the name of the planet's article on the wiki, so a planet
moved or renamed there, including a player claiming it and naming it, is renamed in the atlas without
touching the atlas data. Every atlas does this the same way.

## Lookup

- `DATA.planetArticles[key] = { title, display, pageid, aliases[] }` holds what the wiki last said.
  `display` is the article's DISPLAYTITLE (markup removed) when it sets one, else the title.
- `planetKey(name)` finds a planet from its key, its `articleTitle`, its current title or display, or any
  earlier title, so old names keep working in links and search.
- `planetName(name)` is the name to show; `planetArticle(name)` is the article title, or null;
  `planetAliases(name)` are the titles it has had.
- `canonicalTitle(name)` is the article for any name: the live title of a planet, else the
  `articleTitle` (or name) of the catalogue record the name or an alias belongs to. A single-star
  system's star article wins for the star's name.
- `url(name)` links a planet by page id once known (`index.php?curid=<id>`), otherwise by title.
- `link()`, labels, aria text, the index and the dossier all show `planetName`.

## Sync

`startPlanetTitleSync()` restores the titles saved from earlier visits (localStorage
`atlas-planet-articles-v1:<atlas id>`) before the first draw, then `syncPlanetTitles()` asks the wiki:

- A planet whose page id is known is asked for by id. A page keeps its id when moved, with or without a
  redirect, and an article recreated at an old title is ignored.
- A planet with no known id is asked for by its `articleTitle`, or its key. Redirects are followed.
- Requests are 40 names each, two at a time, 12 s timeout each. A failed request, an API error or a
  malformed response leaves the names already known.
- It runs at start, on focus, when the browser is online or the tab is visible again, and every 60 s while
  visible. A hidden tab asks nothing.
- When something changed it saves and redraws the page (scroll and focus kept), and restores a route that
  named a planet.

The wiki address is the slot `wikiBase`, which the host supplies (`host.wikiBase`; the loader config key
`wikiBase`): `<wikiBase>/api.php` and `<wikiBase>/index.php`. It is the wiki's own address, the same for
every atlas, so it is not set per atlas. Without it the default in `engine/bundle.json` is used.

## Planets with no article yet

A planet with no name of its own is named `<system> <numeral>` and links to the article of that name.
Until the article exists the page is missing, so the name stays. When someone creates a redirect from that
title to the real article, the next sync follows it, records the real title and page id, and the page id
drives the name from then on.

## Covers

Planets (`data.worlds`). Moons, stations and the rest are not looked up yet.

## Tests

`tests/title-sync.test.mjs` runs the functions against a fixture wiki: absent article, move with a
redirect, multi-hop redirects, DISPLAYTITLE, old titles, claiming a default-named planet, move without a
redirect, offline and deleted pages, broken storage, batching, hidden tabs, request options.
`tests/iulr-dom.cjs` runs the same through a whole page.

## Changes from the three earlier implementations

Cache keys changed, so saved titles from before are discarded once. Elysian's in-place patching of
`data-planet-title` attributes is gone; a change redraws. UACS's alias list and IULR's page-id rule are
part of the one version. The flags `planetPageLinks`, `planetArticleTracking`, `planetLinkAttributes`,
`linkTitleSync`, `planetArticleTitles`, `inspectLabelsUseTitles`, `svgTextSyncedTitles`,
`titledLocalOrbitLabels`, `titledPlanetInspectLabel`, `normalizeTitleApostrophes`,
`straightenImageTitleQuotes` and `indexWorldLinks` are removed: all atlases behave as the most complete
setting did.
