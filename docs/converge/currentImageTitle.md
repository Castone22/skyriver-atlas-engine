# currentImageTitle

Converged to `engine/functions/currentImageTitle.js` (was five variants).

```js
const title = planetArticle(name) || record?.articleTitle || canonicalTitle(name);
return flags.straightenImageTitleQuotes ? title.replaceAll('’', "'").replaceAll('‘', "'") : title;
```

| Difference | Variants | Resolution |
| --- | --- | --- |
| The synced article title of a planet is preferred | Elysian (`planetKey` + `planetArticles`), UACS (`planetArticle`), IULR (`planetArticleName` for catalogued worlds) | **Hook** `planetArticle(name)`: the synced title, or `null`. UACS already had it. New per-atlas implementations: `planetArticle-synced` (Elysian), `planetArticle-resolved` (IULR, which returns the resolved or canonical title for any catalogued world and `null` otherwise, exactly as its old variant behaved), and `planetArticle-none` (Calidor, Kadaym). |
| Curly apostrophes are replaced by straight ones in the result | Kadaym only | **Flag** `straightenImageTitleQuotes` (on for Kadaym). |

The per-atlas `planetArticle` implementations stay separate files: they read each atlas's own
title-sync state (see `planetName.md`). No questions.

Superseded in part: the flags described here are removed. Every atlas now looks planet names up from the wiki the same way; see `title-sync.md`.
