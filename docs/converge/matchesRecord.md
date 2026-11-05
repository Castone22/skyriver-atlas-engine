# matchesRecord

Converged to `engine/functions/matchesRecord.js` (was four variants; Elysian's and IULR's were
already textually identical).

| Difference | Variants | Resolution |
| --- | --- | --- |
| `planetName(record.name)` is matched | Elysian, IULR, UACS | **Hook** `planetName`; Calidor and Kadaym use the identity hook (a duplicate of `record.name`, harmless in `.some`). |
| `...planetAliases(record.name)` is matched | UACS only | **Hook** `planetAliases`; the other four return `[]`. |

The hooks are introduced in `classificationTerms.md`. No flags. No questions.
