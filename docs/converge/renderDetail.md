# renderDetail

**Not converged.** Five variants remain (46 to 61 hunks each against Elysian's, about 200 in total).

What blocks it is not feature flags; it is authored content written into the function. The empty-detail
panel (what the page shows before something is selected) holds, per atlas, hard-coded:

- Region and overview headings and blurbs: "The Ordained Dominion", "VERITAS ET ORDO", "Fifty-three systems along the rimward edge of the Cluster…" (Calidor); "The Collective comprises 57 inhabited planets across 463 controlled star systems…" (Elysian); similar text for Kadaym, IULR and UACS.
- "Explore" cards that name specific places and wire them to ids and buttons: Elysian's `Lighthouse Nebula` / `Lighthouse Core Array` / `exploreLighthouse`, Calidor's `Calidor` / `Dominion City` / `Foundry` / `exploreCapital`.
- A "Chart notes" block of provenance sentences ("Second edition", "twenty new systems expand the register", "Original system positions follow your reference", …) that differ per atlas.
- Counts written as literals (`53`) in one variant and computed (`DATA.systems.length`) in another.

Under `AGENTS.md` ("code never names a specific system, planet or faction") this content belongs in the
atlas data, for example in `presentation` (or the region records): an overview heading, an overview blurb,
a list of explore cards (`label`, `target`, `description`), and a notes block, all rendered by one shared
function. That is a data-model change that touches all five `atlas.json` files and every place the panel is
read, so it should be its own piece of work with the golden tours after each atlas.

## Mechanical differences that will be easy once the content is data

- `stationOverview` early return that renders `stationScreen` (Elysian has it; the others do not).
- `applyPlanetTitles()` call and `greatBlinkFrame(planetFocus)` in the planet dossier (Elysian only; the great-blink frame is data-gated on the appearance).
- Region wording ("Collective overview" against "Dominion overview" and so on): slots.

## Question

- Whether the explore cards are meant to be hand-curated per atlas (as now) or generated from the data.
  The first is a data field; the second needs a rule for which systems get a card.
