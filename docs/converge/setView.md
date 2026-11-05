# setView

Variants merged: calidor+elysian+uacs, kadaym, iulr (3 -> 1). Result: converged, flags
`regionHighlight` (shared) and `widgetOutlineState`, three new slots, and new region data fields.

## Content moved out of the code (Kadaym -> `bundles/kadaym/atlas.json`)

Kadaym's `setView` hard-coded, for its own regions, the map kicker (a seven-entry table plus a rule
for the rest) and two special subtitles. They are now fields on each region, read by the shared function:

- `regions[id].mapKicker`: set for all 15 Kadaym regions, to exactly the text the old code produced
  (the table entry, else `KURZENZKA SECTOR / SILENT OCCUPATION` for silent regions, else
  `FEDERATION / REGIONAL CHART`). When present it is used for the kicker.
- `regions[id].mapSubtitle`: set for `narthezk` and `frontier` (the two special cases). Otherwise the
  subtitle is `<subtitle> · <n> charted systems`, as before.

The other atlases have no such fields, so they build the kicker from the region subtitle and the
overview title slot as before.

## Slots

`overviewOptionLabel` (new: `Overview · ` for Calidor/Elysian/UACS, `Federation overview · ` for
Kadaym), plus `overviewTitle` and `overviewSubtitle` for Kadaym (`FEDERAL TERRITORIAL OVERVIEW`,
`Regional positions are schematic · remote holdings shown separately`). IULR's highlight path never
uses them; they are set to empty strings because the shared source names them.

## Other differences

| Difference | Resolution |
| --- | --- |
| IULR keeps `highlightedRegion` and has no overview chart; its `setView(key, keepSelection)` takes no overview or camera arguments, handles widget regions and calls `updateRegionDisplay` | Kept whole as the `regionHighlight` path of the converged function; it returns before the shared code. |
| Region outlines get `aria-pressed` even in widget mode (Calidor/Elysian/UACS) but not in Kadaym | `widgetOutlineState` |
| Kadaym had no `resolveRegion` guard and no `stationOverview=false` | The guard is added for it (every caller passes a resolved region, so it never fires) and `stationOverview=false` is always done (Kadaym declares it and never sets it). |
| For the whole-atlas view with `overview` false, the old shared code would read `r.subtitle` of an undefined region and throw | Now uses the overview title instead of throwing, which only changes a case that crashed. |

## Questions

- `widgetOutlineState`: Kadaym skips the outline state in widget mode and the others do not. Probably
  a leftover, but preserved. The tours do not cover widget mode.
