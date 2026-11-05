# searchTerms

Converged to `engine/functions/searchTerms.js` (was two variants).

## Differences found

| Difference | Variant | Resolution |
| --- | --- | --- |
| `s.name==='Kevak'?'Palorek':''` — a lore alias for one system written into code | Calidor, Elysian, Kadaym, UACS | **Data.** Elysian and Kadaym (the only atlases that contain a system named Kevak) now carry `searchAliases: ["Palorek"]` on that system. Code reads `s.searchAliases`. |
| `s.architecture, s.cloakStatusText, s.description` searched | IULR only | **Flag** `searchSystemFields` (a list of system property names). Default `[]`; IULR's `bundle.json` sets the three names. |

## Notes

- The new field is `searchAliases`, **not** the existing `aliases`. `aliases` is also used for
  route resolution (`matchesRecord` matches `?system=` against it), so adding "Palorek" there would
  have made `?system=Palorek` start resolving. `searchAliases` affects search only.
- Behaviour is unchanged for every atlas. Atlases without a Kevak system (Calidor, IULR, UACS) gain
  nothing; atlases without extra fields get an empty list.
- The term order changed slightly (aliases and extra fields come right after the region name). The
  only consumer is `renderIndex`, which uses `.some(...)`, so order does not matter.

## Questions

None.
