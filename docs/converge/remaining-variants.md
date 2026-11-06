# Remaining hashed variants: what differs

Every difference between variants of the same function falls in one of these categories. The
category says how it converges.

| Code | Category           | Converges as                                                            |
| ---- | ------------------ | ----------------------------------------------------------------------- |
| COPY | Wording            | A slot (`bundle.json` `slots`), used as `{{name}}` in the function      |
| LORE | Content in code    | Atlas data (`atlas.json`): ids, names, feature lists, region ids        |
| FEAT | Optional feature   | A flag in `engine/flags.json`, set per atlas; off for atlases without it |
| HOOK | Atlas behaviour    | A small function the atlas defines under one name; the engine calls it  |
| SHAPE| Data shape         | The function accepts both shapes (for example `stars` and `primaries`)  |
| OLD  | Older implementation | One implementation is a previous version of the other; keep the newer |
| LAYOUT | Real difference  | Geometry or DOM that differs on purpose; needs a flag or a policy value |
| ENGINE | Other engine     | Not a variant: a different renderer sharing a name                      |

## planetName (4 files)

| File           | Atlases          | Reads                                          | Category |
| -------------- | ---------------- | ---------------------------------------------- | -------- |
| `identity`     | calidor, kadaym  | the name itself                                | HOOK     |
| `2cc548f30373` | elysian          | `planetArticles[planetKey(name)].title`        | HOOK     |
| `b16b654e272b` | uacs             | `planetTitleRecord(name).title`                | HOOK     |
| `27a93d2d3c84` | iulr             | `planetResolvedTitles.get(name)`               | HOOK     |

One contract (stable name in, current Codex title out), three stores for the titles that
`syncPlanetTitles` fetches. Converges by giving the three stores one shape, and `identity` is the
case with nothing fetched. Depends on `syncPlanetTitles`.

## syncPlanetTitles (2 files; IULR has the same feature inline in its runtime)

| Difference                                                                  | Category |
| --------------------------------------------------------------------------- | -------- |
| Elysian keys titles by world key and page id (`planetArticles`); UACS keeps a map of records with `pageid` or a seed title | SHAPE |
| Elysian fetches batches of 40 with two parallel workers, a 12 s abort and a 60 s repeat timer; UACS fetches batches in sequence with a 3 s or 60 s throttle and no timer | OLD |
| Elysian writes the Codex API address into the function                      | LORE     |
| Cache key names (`elysian-atlas-planet-articles-v1`, IULR's own)            | COPY     |
| After a change Elysian re-applies titles and restores the route; UACS refreshes the UI | HOOK |

## labelThresholds (2 files)

| Difference                                                                                 | Category |
| ------------------------------------------------------------------------------------------ | -------- |
| IULR keeps its levels in `LABEL_ZOOM` in the runtime; the others read `policies.labels`    | LORE     |
| IULR scales by `520 / min(width, height)` and returns a pair for `active` or `neighbor`; the others scale by `640` and `360` and return an object of pairs, with a `fixed` option | LAYOUT |

## scaleLabels (2 files)

| Difference                                                                                          | Category |
| --------------------------------------------------------------------------------------------------- | -------- |
| IULR labels each system (`record.region === highlightedRegion`), hides planet labels below a second level, and writes the thresholds into the zoom label's title | FEAT |
| The others label by region (`.node-label` inside `[data-region]`) and choose among four region-label styles (`regionLabelStyle`) | FEAT |
| Node label scale `.78` against the `nodeScale` policy                                               | LAYOUT   |

IULR's region highlight already exists as flags. The remaining gap is the per-system threshold pair.

## starRecords (3 files)

| File           | Atlases                    | Difference                                                                                   | Category |
| -------------- | -------------------------- | -------------------------------------------------------------------------------------------- | -------- |
| `starRecords`  | calidor, elysian, kadaym   | Reference. `primaries`, exotic types, triple stars, tint by type                             | -        |
| `2ae8652d7987` | uacs                       | Black-hole companion tag "Blue-white stellar companion"; "Outer stellar companion" / "Inner binary component" tags; `starColors` and `starColor` for tint; `primaryDescriptions`; `blackHole` and `source` fields | COPY, FEAT |
| `edf881d7ebd2` | iulr                       | Reads `stars[]` objects with `spectralClass`; tint by class; description generated from the class | SHAPE |

UACS tags are wording; the data fields it reads (`starColors`, `primaryDescriptions`) are optional
fields the reference could read too. IULR needs the function to accept `stars` as well as
`primaries`.

## stationHasOverview (2 files)

| File        | Atlases                          | Test                          | Category |
| ----------- | -------------------------------- | ----------------------------- | -------- |
| `tora`      | calidor, iulr, kadaym, uacs      | `b.category === 'TORA'`       | HOOK     |
| `schematic` | elysian                          | `hasStationSchematic(b)`      | HOOK     |

`hasStationSchematic` is already an atlas hook. Converges to the second form with each atlas's
`hasStationSchematic` as the single definition.

## zoom (2 files)

`zoom-06a8e0e21ab3` belongs to Mahanzk, the geographic renderer (`panX`, `panY`, `scale`). It shares
a name with the stellar `zoom` and nothing else. ENGINE: it moves out with the surface-map engine.
Its siblings `zoomBy` (Grand) are the same case.

## mountSystem (4 files)

`mountSystem-shared` (elysian, kadaym) is the reference.

| File           | Atlas   | Difference from the reference                                                                                       | Category |
| -------------- | ------- | ------------------------------------------------------------------------------------------------------------------- | -------- |
| `d80d9c15a5ef` | calidor | Black-hole binary geometry (`blackBinary`: radii, guide ellipse, mover radii, glyph size); black hole only for star 0 | FEAT     |
|                |         | Returns early unless the system is focused                                                                          | FEAT     |
|                |         | Foundry glyph for `schematic === 'foundry'`; TORA test by category instead of `hasStationSchematic`                 | HOOK     |
|                |         | No `derivedBelts`, `orbitTiltOffset`, `extendedSatelliteChart` or `systemBodyRenderOpacity` handling (the reference has them behind flags) | OLD |
| `a3742fa457e9` | uacs    | `s.starColor` for the halo; other black-hole radii                                                                  | LORE, LAYOUT |
|                |         | `s.orbitRadii`: explicit per-system orbit radii                                                                     | FEAT     |
|                |         | `solarAnalogue`: fixed phases, tilt and a planet glyph for a Sol-like system                                        | FEAT     |
|                |         | Black-hole pairs get their own guide ellipse and mover radius                                                       | FEAT     |
|                |         | Hides the label of a proposed planet until its Codex title is known                                                 | FEAT     |
|                |         | `planetName()` in labels and titles                                                                                 | HOOK     |
| `368a20b29dd5` | iulr    | No triple stars or `projection`; radii as an older fixed formula                                                    | OLD      |
|                |         | Stations drawn on parent or lane tracks with fixed constants, a backing circle and a `.77` glyph scale              | LAYOUT   |
|                |         | `storm-bands` planet appearance                                                                                     | FEAT     |
|                |         | `renderOpacity < 1` marks a filler track; label hidden when `renderOpacity === .6`                                 | FEAT     |
|                |         | Distant-TORA row ("OUTER-SYSTEM TORA ARRAYS") with its own classes, padded codes and `bindToraName`                 | COPY, FEAT |
|                |         | Planets are not raised above stations                                                                               | OLD      |
|                |         | `planetName()` in labels and titles                                                                                 | HOOK     |

## renderDetail (5 files)

`renderDetail-33028d7ad651` (elysian) is the reference. The empty-state panel (no system selected)
accounts for most of the text that differs.

| Difference                                                                                       | Atlases                      | Category |
| ------------------------------------------------------------------------------------------------ | ---------------------------- | -------- |
| Panel eyebrow, motto, heading, summary paragraph, notes, "Open ... article" labels               | all five                     | COPY, LORE |
| Feature buttons with fixed ids (`lighthouse`, `calidor`, `sol`, `heimdall`, `dsc-346`, `exploreSystem`) | elysian, calidor, uacs, iulr | LORE (a list in `atlas.json`) |
| Noun for the nation: Collective, Dominion, Federation, Alliance, Union (aria label, "region system") | all five                | COPY     |
| Classified-system list, sector tier key, former empire, historical source                        | kadaym                       | FEAT     |
| Capital fact grid                                                                                | uacs                         | FEAT     |
| Coverage counts computed from the systems                                                        | iulr                         | FEAT     |
| Chart summary for the highlighted region (`highlightedRegion`)                                   | iulr                         | FEAT     |
| Station overview screen inside the detail panel                                                  | elysian                      | FEAT     |
| `greatBlinkFrame`, `cloakDecoration`, `cloakBadge`                                               | elysian (greatBlink); not kadaym (cloak) | FEAT |
| "Open Foundry schematic" button                                                                  | calidor                      | FEAT     |
| "Open station overview" button for TORA                                                          | iulr                         | FEAT     |
| Region summary function called `systemView`, `regionalSystemSummary` or `regionSystemSummary`    | elysian/kadaym/iulr, calidor, uacs | OLD (rename) |
| `applyPlanetTitles`, `planetNameMarkup`, `data-planet-link`, or `esc(planetName(...))` in the Codex button | elysian, others      | HOOK     |
| Coordinates note: `DATA.regions[s.region].file` against the region id `narthezk`                 | elysian; kadaym              | LORE     |

## systemView (5 files)

`systemView-21d3975cb065` (elysian) is the reference.

| Difference                                                                                       | Atlases                       | Category |
| ------------------------------------------------------------------------------------------------ | ----------------------------- | -------- |
| Catalogue heading: "WORLDS & MOONS" against "MAJOR WORLDS & MAJOR MOONS"; "STATIONS" against "MAJOR STATIONS & ARRAYS" | elysian; others | COPY |
| Key labels: Planet/Moon, Named world/Unnamed planet, Chart-named world/Proposed catalogue planet | all five                      | COPY     |
| Caption wording, including the `sparseOrbits` sentence                                           | all five                      | COPY     |
| Moon noun and which moons are counted: `moonRecords(s)` "natural satellite" against `moons` "major moon" or "inhabited moon" | elysian; others | COPY, FEAT |
| "Binary/Trinary system" prefix and the surviving-orbits wording                                  | kadaym                        | FEAT     |
| `planetName()` in aria labels and titles                                                         | uacs, iulr                    | HOOK     |
| Station-type filter hides TORA                                                                   | calidor                       | FEAT     |
| `' · Foundry off scale'` for `s.id === 'calidor'`                                                | calidor                       | LORE     |
| `foundryCorner` inside the chart                                                                 | calidor                       | HOOK     |
| "Go to Black Hole" link text                                                                     | calidor                       | COPY     |
| Summary line from `otherStationCount` and `toraCount`; "register orbit" wording; TORA caption    | iulr                          | FEAT, COPY |
| `cloakDecoration` omitted                                                                        | kadaym                        | FEAT     |

## Order of work

1. COPY and LORE across `renderDetail` and `systemView`: new slots and an `overview` block in
   `atlas.json`. Largest reduction, lowest risk, and it is the same work the default shell needs.
2. HOOK items: `planetName`, `stationHasOverview`, `hasStationSchematic` and the title store.
3. FEAT flags for `mountSystem` (black-hole binary, orbit radii, solar analogue, proposed-label
   hiding, TORA register).
4. SHAPE and OLD: `starRecords` taking `stars`; retire the older IULR `mountSystem`, `labelThresholds`
   and `scaleLabels` paths by flag.
5. ENGINE: `zoom` and `zoomBy` leave with the surface-map and galaxy engines.
