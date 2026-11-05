# stationRecords

Converged to `engine/functions/stationRecords.js` (was two variants).

| Difference | Variants | Resolution |
| --- | --- | --- |
| First link is the system's article title rather than its name | IULR | **Flag** `stationLinksUseArticleTitle` (on for IULR). Depends on `systemArticleTitle` and its own flag `systemRecordArticleTitle`. |
| TORA stations link to `Terranos Omnidirectional Reflector Array` (lore in code) | IULR | **Data.** The station category definition carries the article: `STATION_TYPES.TORA.article` in IULR's runtime. The converged function links `STATION_TYPES[b.category].article` when one exists. No other atlas defines an `article`, so nothing else changes. |

No questions.
