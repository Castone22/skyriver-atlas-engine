# systemView

**Not converged.** Five variants remain (Calidor, Elysian, IULR, Kadaym, UACS). 15 to 24 hunks separate each
from Elysian's, so about 80 distinct edits. The function is 13 long lines of dense template literals; a
converged version needs roughly 20 wording slots and several flags, which is large enough to deserve its
own pass with the golden tours after each step.

Findings so far (from `build/scratch/wdiff`, a token diff that looks inside template literals):

## Wording: slots

Most hunks are per-atlas text and need no logic. A slot per phrase works:

- Head summary: "natural satellite" (Elysian, Calidor uses "major moon", Kadaym "inhabited moon", UACS "major moon"); `major station`; IULR spells out `otherStationCount orbital facilities · toraCount distant TORA`.
- Section headings: "WORLDS & MAJOR MOONS" (the four newer variants) against "WORLDS & MOONS" (Elysian); IULR adds "MAJOR STATIONS & ARRAYS".
- Sample key: "Planet / Moon" (Elysian), "Chart-named world / Proposed catalogue planet" (UACS), "Named world / Unnamed planet" (Calidor, IULR, Kadaym).
- Caption sentences. Four variants build the caption from `s.sparseOrbits ? <text> : <text>` plus `planets.some(b => DATA.worlds[b.name]?.extendedSatelliteChart) ? … : …`; Elysian has a fixed caption. `sparseOrbits` is set on **every** system in all five atlases (53, 66, 41, 15, 42 systems), so the `: …` branches are currently dead and the per-atlas text in the `?` branch is what shows.
- Orbit tooltips: "documented orbit" against IULR's "register orbit".

## Data-gated or needing a flag

- **Binary and trinary labels** (Kadaym only): `family = {2:'Binary',3:'Trinary'}[s.primaries?.length]`, shown in the head and the "system view" tag. Every atlas has systems with 2 or 3 primaries (Calidor 11, Elysian 2, IULR 16, Kadaym 25, UACS 14), so this must be a flag (`systemFamilyLabel`), not data-gated, or all other atlases would start showing it.
- **Belt button attribute order** (Kadaym: `aria-pressed` before the `disabled title`; the rest the other way round). A flag, because the golden tours compare attribute order.
- **Cloak decoration** missing from Kadaym's call list: harmless now that Kadaym links `cloakDecoration` (added for `planetView`).
- **`surviving world orbits`** wording in Kadaym is gated on `s.sparseOrbits`, which is true for every Kadaym system, so it is a wording slot.
- **Calidor lore in code**: `s.id === 'calidor' ? ' · Foundry off scale' : ''` and `expanded && stationRecords(s).some(b => b.name === 'Foundry') ? foundryCorner() : ''`. Both name specific content. They should become data (a system `summaryNote`, and a station property that selects the corner drawing).
- `star.tag === 'Black hole' ? '◉  Go to Black Hole' : '✦  Go to Star'` (Calidor): black holes exist in other atlases' data too, so check before treating it as data-gated.
- `TORA` filter in the station filter list (Calidor: `.filter(([name]) => name !== 'TORA')`): the same `hiddenStationFilters` flag introduced for `planetView` applies.
- IULR: `planetName(b.name)` in inspect labels and tooltips (`titledLocalOrbitLabels`-style flag), and the TORA and "other station" counts in the head summary, which come from IULR-specific station categories.

## Suggested order

1. Add the wording slots (all five bundles) and the flags above, then build the converged function from IULR's text, which has the most structure, checking after each of: head, headings, sample key, caption, station block.
2. Do the Calidor lore as a data change first, so the function stops naming `calidor` and `Foundry`.
