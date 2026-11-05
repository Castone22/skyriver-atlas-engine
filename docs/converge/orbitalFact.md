# orbitalFact

Converged to `engine/functions/orbitalFact.js` (was three variants).

| Difference | Variants | Resolution |
| --- | --- | --- |
| A hard-coded case for the station named `Foundry` ("STELLAR MEGASTRUCTURE", "Calidor stellar orbit · shown off scale", colour `#dcc28d`) | Calidor | **Data.** The Foundry station in Calidor's `atlas.json` carries `orbitalFact: {label, note, color}`; the function renders any record that has one. |
| A station with `orbitalZone === 'outer-system'` reads "Outer stellar orbit · beyond chart scale" | IULR | **Data-gated.** Only IULR's stations have `orbitalZone`. |
| The position caption reads `ORBITAL POSITION · CODEX` or `· UNION REGISTER` | IULR | **Slot** `orbitalRegister` (every bundle defines it; `CODEX`, and `UNION REGISTER` for IULR). The value is inserted as HTML text. |

No questions.
