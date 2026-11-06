# Decisions on open questions

Answers from the maintainer to the questions the convergence work raised. **Decisions 1, 3, 4, 6, 10, 12 and 13 are implemented (see
"Status" below); 2 and 11 are not yet.** Each one changes what an atlas renders, so each needs the golden files for the
affected steps regenerated and reviewed (`npm run golden:update`, then read the diff) before it is
committed. Do the work in small commits, one decision each, and finish with `npm run check:full`.

| # | Question | Decision | Flag or place to change |
| --- | --- | --- | --- |
| 1 | Kadaym's empty-search hint says "Elysian Collective"; Calidor and UACS mention a "Forge" system | Copy-paste mistakes. Forge is an Elysian system only. Fix the hint text per atlas. | `indexHint` slot in each `bundle.json`; `indexFirst` data |
| 2 | Four atlases link systems as `<name> System` though their data has `articleTitle` | Wiki articles are normally `<name>`, or `<name> (system)` when ambiguous. Use `articleTitle` when set; otherwise derive it from the system name. Never append " System". | turn `systemRecordArticleTitle` on everywhere and change the fallback |
| 3 | Empty live dossier facts: only IULR falls back to catalogue facts | See the explanation below. Recommended: every atlas falls back. | `emptyDossierFactsFallBack` on for all |
| 4 | UACS hard-codes "DSC 346 B" and its own star-tag wording | See below. Move the black-hole text into UACS data; unify the tag vocabulary later. | `starRecords` UACS variant |
| 5 | `aria-label` on the local-orbit view (UACS only uses the synced title) | Low value: these maps are hard for assistive tools anyway. Leave as is. | none |
| 6 | UACS picks the extended moon layout by count (>10) not by data; IULR shows `shortLabel` only in extended layout | See below. | `extendedChartMoonThreshold`, `shortLabelsOnlyWhenExtended` |
| 7 | UACS black-hole sizes differ from Elysian and Calidor | Not a problem: black holes can differ in size. Keep as data or policy per atlas. | none |
| 8 | Kadaym straightens curly apostrophes in article links | Keep as a styling flag; Kadaym may standardise this in its own starmaps. | `normalizeTitleApostrophes`, `straightenImageTitleQuotes` |
| 9 | Kadaym and IULR close the mobile index drawer on selection, the others don't | Correct as is. | `closeSidebarOnSelect` |
| 10 | IULR rewrites the address bar in widget mode, the others don't | Rewrite the address in normal mode (so the state can be copied). In widget mode do not: the widget is embedded, its address is never seen, and extra history entries trap the Back button inside the frame. So IULR should match the others. | `widgetKeepsAddress` on for IULR |
| 11 | Widget mode without a query; outline pressed-state in widget mode | Widget mode should show an error when no query is passed. Outline pressed-state should be supported in widget mode for every atlas. | `widgetOutlineState` on for all; new error state |
| 12 | `regionHighlight` bundles several routing quirks | Split them into separate flags. | `regionHighlight` |
| 13 | Foundry identified by name in code; Grand search entries | Fine. Grand does not display Forge directly; that is a copy-paste artifact. Move the Foundry into station data. | station data (`schematic`) |

## Status

| # | State |
| --- | --- |
| 3 | Done (`c11ea4f`): `emptyDossierFactsFallBack` is on for all five atlases. |
| 4 | Done (`9b14fef`): DSC 346's star descriptions are `primaryDescriptions` in UACS data; the full UACS tour is unchanged. |
| 6 | Done (`3ebf592`) for IULR: short labels in every layout (265 planet views changed, IULR goldens regenerated). UACS keeps `extendedChartMoonThreshold: 10`: its `extendedSatelliteChart` data flag is set on all 269 of its worlds and only 37 have more than 10 moons, so the flag cannot drive the layout there. |
| 10 | Done (`c11ea4f`): `widgetKeepsAddress` is on for IULR, so every atlas leaves the address alone in widget mode. |
| 1 | Done: Kadaym's empty-search hint now names the United Federation of Kadaym; the Forge references in Calidor and UACS were already removed when that content moved into data. One golden step changed (`ui:search:zzz-no-such-thing`). Kadaym's `affiliationLink` "Elysian Collective" is genuine lore and stays. |
| 12 | Done: `regionHighlight` now means only that the page tracks a highlighted region; eight behaviour-named flags (`hashIgnoredWithRegion`, `noOverviewRoute`, `addressRegionWins`, `focusRegionIgnoresRegion`, `noLocalChartFallback`, `highlightRouteParam`, `highlightedRegionState`, `selectKeepsRegion`) carry the rest, all on for IULR only. No golden step changed. Notes: `docs/converge/regionHighlight.md`. |
| 13 | Done: the Foundry is `"schematic": "foundry"` in Calidor's station data and code tests that field. A few display-copy and attribute-name mentions of the name remain on purpose (`docs/converge/foundry.md`). No golden step changed. |
| 2, 8, 11 | Pending. 2 changes the link on nearly every system in four atlases (regenerate and review the affected goldens); 8 needs no work beyond keeping the flags; 11 adds a widget-mode error state and the outline pressed-state, which the tours do not drive, so it needs its own tests. 5, 7 and 9 need no change. |

## Explanations given with the decisions

- **3. Empty dossier facts.** Selecting a world or system shows a dossier. When the wiki is reachable
  the atlas loads the article's infobox. If that loads but lists no fields, four atlases show an empty
  facts grid; IULR shows the facts it has in its own catalogue instead. The recommendation is that an
  empty infobox should never blank a dossier, so every atlas should fall back. Only visible with live
  data, so the offline golden tours cannot see it.
- **4. UACS "DSC 346 B" and star tags.** `starRecords` builds the list of stars for a system. UACS's
  version writes the description of one particular black-hole system into the code ("DSC 346 B is the
  blue-white companion…") and has its own tag wording ("Outer stellar companion", "Inner binary
  component"). The other atlases take their text from system data. Moving the black-hole text into
  UACS data is safe; choosing one tag vocabulary changes visible text.
- **6. Extended layout and short labels.** A planet with many moons gets an "extended" layout with
  smaller labels. Elysian, Calidor, Kadaym and IULR switch to it when the planet's data says
  `extendedSatelliteChart`. UACS ignores that field (269 of its planets have it) and switches when a
  planet has more than 10 moons. Separately, 504 IULR moons carry a `shortLabel`, but IULR uses it
  only in the extended layout. If the field is meant to drive the layout in UACS, set the threshold
  flag to 0; if short labels are meant for every layout in IULR, drop that flag.

## Not investigated

- **Widget mode appearing on a blank URL.** `widgetMode` is set once, at load, only from
  `?view=widget` in the page's own query, and nothing stores it, so the atlas code cannot cause it.
  Treated as a probable browser artifact (URL autofill or a cached embed address). Reopen it only if
  it reproduces with a typed blank URL in a clean profile.
