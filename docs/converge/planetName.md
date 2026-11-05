# planetName (and the planet-title hooks)

**Left as per-atlas hook implementations, by design.** `planetName` is the one name with several
files, but they are not variants of one function: each reads a different title-sync state that its
own atlas maintains.

| Atlas | `planetName(name)` reads | Companion hooks |
| --- | --- | --- |
| Elysian | `planetKey(name)` then `planetArticles[key].title` | `planetKey`, `planetArticle-synced` |
| UACS | `planetTitleRecord(name).title` (`planetTitles`) | `planetAliases`, `planetArticle` |
| IULR | `planetResolvedTitles.get(name)` | `planetArticle-resolved` |
| Calidor, Kadaym | nothing (no title sync): `planetName-identity` returns `name` | `planetAliases-none`, `planetArticle-none` |

## Hook contract (what shared functions may call)

| Hook | Meaning | Default for an atlas without title sync |
| --- | --- | --- |
| `planetName(name)` | the display title of a planet, falling back to `name` | `planetName-identity` |
| `planetAliases(name)` | other titles the planet has been known by (array) | `planetAliases-none` (`[]`) |
| `planetArticle(name)` | the synced article title, or `null` | `planetArticle-none` |
| `planetKey(name)` | the catalogue key for a name, or `null`. **Only Elysian defines it**; shared functions reach it only through `planetArticle-synced` or behind the `planetArticleTracking` flag. | not defined |

Every stellar atlas must define `planetName`, `planetAliases` and `planetArticle`. The shared
functions in this batch (`classificationTerms`, `matchesRecord`, `matchesSearch`, `focusableWorld`,
`currentImageTitle`, `renderIndex`, `bodyKey`) call only those.

## What would converge them

The three real implementations answer one question ("what is this planet called now?") from three
different stores (an article map, a title-record map and a resolved-title map) that three different
sync functions fill. Converging them means rewriting the title-sync feature around one store, which
changes behaviour (cache keys, persistence format and refresh timing) and is out of scope here.

## Needs cross-batch rename / coordination

`url` (batch B) uses `planetKey` in its Elysian variant. If it is converged, it must call a hook or
a flag, because `planetKey` does not exist outside Elysian.

## Questions

None.
