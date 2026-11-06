# classificationTerms

Converged to `engine/functions/classificationTerms.js` (was five variants).

## Differences found

| Difference | Variants | Resolution |
| --- | --- | --- |
| `planetName(record.name)` is a search term | Elysian, UACS, IULR | **Hook.** The converged function always calls `planetName`. Calidor and Kadaym, which have no title sync, get the identity hook `planetName-identity` (`return name`); the extra term is a duplicate of `record.name`, which is harmless because every consumer uses `.some(...)`. |
| `...planetAliases(record.name)` | UACS only | **Hook.** The converged function always calls `planetAliases`. UACS keeps its own; the other four get `planetAliases-none` (`return []`). |
| `record.cordon` is a search term | Kadaym only | **Data-gated.** Always included. Only Kadaym's data has a `cordon` field, so nothing changes elsewhere. |

## Hook contract introduced

`planetName(name)` and `planetAliases(name)` must exist in every stellar atlas. Per-atlas
implementations are one function each (see `title-sync.md`).

## Questions

None.
