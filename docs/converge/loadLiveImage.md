# loadLiveImage

Converged to `engine/functions/loadLiveImage.js` (was two variants).

Elysian looks a planet up by its tracked wiki page id and remembers the page it gets back
(`planetKey`, `planetArticles`, `rememberPlanetArticle`, `savePlanetArticles`, `applyPlanetTitles`).
The other atlases look up by title only. The converged function is Elysian's, with the one line that
starts the tracking behind a flag:

```js
const key = flags.planetArticleTracking ? planetKey(title) : null, identity = key && planetArticles[key];
```

With the flag off `key` is `null`, so `identity` is falsy, the request uses `titles`, and
`rememberPlanetArticle` is never reached. The Elysian-only globals are therefore never evaluated in
the other atlases.

**Flag** `planetArticleTracking` (on for Elysian). No other differences. No questions.
