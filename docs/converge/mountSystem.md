# mountSystem

**Partial.** Kadaym and Elysian now share one file, `engine/functions/mountSystem-shared.js`. Calidor,
IULR and UACS still have their own variants (`mountSystem-d80d9c15a5ef`, `-368a20b29dd5`, `-a3742fa457e9`).
The function has 4000 tokens and the variants differ much more than their token similarity suggests.

## Merged: Kadaym + Elysian (7 differing hunks)

| Difference | Resolution |
| --- | --- |
| Belt drawing: Kadaym shows a belt when `beltSlot` is undefined and the system has more than two orbits, otherwise when `beltSlot > 0`; Elysian only when `beltSlot` is set | Flag `derivedBelts` (default off); Kadaym sets it. |
| A tilt offset of 23 for the planet `Lur` in the system `Ozhava`, written into the code as `s.name==='Ozhava'&&b.name==='Lur'` | **Content in code, moved to data**: `worlds.Lur.orbitTiltOffset = 23` in `bundles/kadaym/atlas.json`; the function adds `DATA.worlds[b.name]?.orbitTiltOffset ?? 0`. Adding 0 is exact in floating point, so every other atlas is unchanged. |
| `opacity` attribute from `renderOpacity` on each body | Elysian only. Flag `systemBodyRenderOpacity`. |
| Station schematic binding (`hasStationSchematic(b)` then `bindToraControl`) | Elysian only. Kadaym gets the hook `hasStationSchematic()` returning `false` in its runtime (it has no station schematics), so the shared function calls the hook everywhere. |

## Not merged, and what blocks it

All three read as groups of independent features. None is a bug fix as far as can be told.

**Calidor** (25 hunks against Elysian):
- A black-hole binary layout (`blackBinary`): central body sizes 135/175, ring radii 55/38.5, scale 1.2, a different stellar mover offset. Data-gated on `centralBodyType === 'black-hole'` with two primaries.
- Station bodies are tested with `b.category === 'TORA'` where Elysian calls `hasStationSchematic(b)`.
- A station named `'Foundry'` is drawn with `foundryGlyph` (a station name in the code; should become a data field).
- An early `if (!systemFocused) return`.
- Stations are filtered by `!DATA.worlds[b.parent]?.extendedSatelliteChart`.
- Star fill `i ? star.tint : 'url(#systemSun)'` where Elysian differs.

**UACS** (37 hunks against the merged file):
- Solar-analogue systems: different flatten, tilt, phase table, ring offsets and a `solarPlanetGlyph` body (data-gated on `s.solarAnalogue`).
- `s.starColor` for the star glow stops (Elysian hard-codes `#f9bd66`) and `s.orbitRadii` for explicit orbit radii. Both are data-gated.
- **Black-hole sizing differs in value**: 130/65 and 180/73 against 94/49 and 216/89. This is a real difference in constants; it needs a policy or flag.
- Titled labels (`planetName(b.name)`) in the inspect label and in the text; a proposed-world condition on the label.
- `TORA` category checks instead of `hasStationSchematic`; a black-hole mover offset.

**IULR** (95 hunks against Elysian): not analysed in detail. It is the most different variant (TORA arrays and hubs, outer-zone handling, `planetName`, `renderOpacity`, `highlightedRegion`-style region state). It should be tackled after the others, with the station-schematic functions (`openStation`, `stationScreen`, `highlightPart`) converged first, because it uses their hooks.

## Questions

- Black-hole size constants differ between UACS and Elysian/Calidor. Whether UACS's larger black hole is intended is unknown.
- `Foundry` and `TORA` appear as literal names in Calidor's and UACS's code. They should become data (a station property such as `schematic`), and `hasStationSchematic` should be the single hook; that is the same work the station-schematic functions need, so it belongs to the batch that owns those.
