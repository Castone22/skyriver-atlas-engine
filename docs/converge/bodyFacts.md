# bodyFacts

Converged to `engine/functions/bodyFacts.js` (was three variants), built from Elysian's.

| Difference | Variants | Resolution |
| --- | --- | --- |
| A dossier's natural-satellite count is replaced by the catalogue count when the world has `satelliteExpansion` | Elysian | **Data-gated.** Only Elysian's worlds have `satelliteExpansion`; elsewhere the mapping is the identity. |
| A system or planet dossier lists stellar architecture, star and station counts, designation, orbital host and moon inventory | IULR | **Flag** `architectureFacts` (on for IULR). Reads `s.architecture`, `s.stars`, `s.stationCount`, `w.catalogueDesignation` and similar, which exist only in IULR's data. |
| A live dossier with an empty fact list: others show an empty grid, IULR falls back to the catalogue facts | IULR | **Flag** `emptyDossierFactsFallBack` (on for IULR). |

## Questions

- The empty-dossier difference only shows for live wiki data. Is IULR's fall-back the intended
  behaviour for every atlas (an empty infobox should not blank the dossier)? It is kept per atlas for
  now; enabling it elsewhere would be one `flags` line in each bundle.
