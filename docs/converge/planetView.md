# planetView

Converged from five variants (Calidor, Elysian, IULR, Kadaym, UACS) into `engine/functions/planetView.js`.

| Difference | Variants | Resolution |
| --- | --- | --- |
| "Elsewhere in the system" pills for stations with `visibility: 'register'` (and the blank line its slot leaves in the markup) | Kadaym only | Flag `elsewhereStations` (default off); Kadaym sets it. Only Kadaym has `register` stations, but the blank line is part of its output even when the list is empty, and the golden tours compare whitespace, so this is an opt-in flag and not gated on data alone. |
| `${cloakDecoration(s)}` in the focus visual | all except Kadaym | Kept for everyone. Kadaym gains the shared `cloakDecoration` function (marker added to its runtime). Inert there: it returns `''` unless a system has `cloaked`, and Kadaym has none. |
| `${cloakBadge(s)}` after the head summary line | IULR only | Kept for everyone. Calidor, Elysian and UACS already link `cloakBadge`; Kadaym gains it. Data-gated: it returns `''` unless `s.cloaked`, and only IULR has cloaked systems; the text comes from `s.cloakStatusText`. |
| TORA left out of the local station filter bar | Calidor only | Flag `hiddenStationFilters` (array of category names, default `[]`); Calidor sets `["TORA"]`. |
| Accessible labels use `planetName(name)` instead of the catalogue name | UACS only | Flag `titledLocalOrbitLabels` (default off); UACS sets it. `planetName` is only called when the flag is on, so atlases without a `planetName` need no definition. |
| "moon" against "natural satellite" in the head summary | IULR vs the rest | Slot `localMoonNoun`. |
| Empty-state note ("No local objects charted." against "No moons or hosted stations are catalogued for this world.") | IULR vs the rest | Slot `localEmptyNote`. |
| Caption sentence ("Moon and station assignments follow the second-edition survey" against "Only recorded host relationships are shown") | IULR vs the rest | Slot `localCaptionNote`. |

## Questions

- Only UACS puts the synchronised planet title in the local-orbit `aria-label`s. Elysian and IULR also
  have a title hook (`planetName`) and synchronise titles, but use the catalogue name there. This may
  be an oversight in those two rather than intent. The converged function keeps each atlas as it was;
  turning `titledLocalOrbitLabels` on for Elysian and IULR would be a (small) behaviour change.
- The caption wording and the empty-state note differ for IULR only; they read like text edited in one
  fork and not carried to the others. They are slots for now so nothing changes.

## Notes for whoever continues

- `tools`' similarity numbers hid differences inside template literals, because a whole template literal
  is one token. `planetView` looked 98 to 99% similar and was not. Tokenise the inside of template
  literals before trusting a similarity figure (the worker scratch diff did this once fixed).
