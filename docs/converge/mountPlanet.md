# mountPlanet

Converged from four variants (Calidor and Kadaym shared one; Elysian, IULR, UACS) into
`engine/functions/mountPlanet.js`. Built from the UACS text, because UACS holds the most structure.

| Difference | Variants | Resolution |
| --- | --- | --- |
| Great-blink globe: larger focus ring (80), clipped globe image from `DATA.assets['primex-globe']`, label offset 108 | Elysian | **Data-gated** on `root.appearance === 'great-blink'`. Only one Elysian body has that appearance. |
| Solar-analogue glyph (`solarPlanetGlyph`) replaces the sphere and all appearance drawings | UACS | **Data-gated** on `DATA.worlds[name].solarAnalogue`, which only UACS has. `solarPlanetGlyph` is now linked in every atlas (it was UACS only) so a future atlas with that data cannot hit a missing function. The two branches nest: solar glyph, else (great-blink globe, else sphere) then the appearance drawings, which reproduces both original block boundaries. |
| Extended satellite layout when the planet has more than 10 moons | UACS | Flag `extendedChartMoonThreshold` (number, default 0). UACS sets 10. With 0, the layout follows `worlds[].extendedSatelliteChart` as in the other atlases. |
| Explicit `font-size` on satellite labels (8 in the extended layout, 11 otherwise) | UACS | Flag `sizedFocusBodyLabel`. |
| `opacity` attribute on the central body, from `renderOpacity` (default 1) | IULR | Flag `bodyRenderOpacity`. Not data-gated: Elysian and UACS also carry `renderOpacity` in their data but never applied it here, so presence of the field is not a safe signal. |
| Central body labelled `Inspect <planetName(name)>` | IULR, UACS | Flag `titledPlanetInspectLabel`. |
| Moons start a fixed golden-angle step apart (`phase: 1.3 + i * 2.39996`) instead of 2.1 outside the extended layout | IULR | Flag `goldenAngleMoonPhase`. A first reading of this as numerically identical was wrong: IULR drops the conditional, so its moons sit at different positions whenever the chart is not extended. The golden tour caught it. |
| Satellite label uses `shortLabel` only in the extended layout | IULR | Flag `shortLabelsOnlyWhenExtended`. IULR's data does have `shortLabel` on 504 satellites, so this is a real difference, not just a data accident. |

## Questions

- UACS decides "extended" from the moon count (more than 10) although its data carries
  `extendedSatelliteChart: true` on 269 records. Whether the field was meant to drive the layout there
  is unknown; the two may disagree for some planets. Behaviour kept.
- IULR limits `shortLabel` to the extended layout while its data has short labels for almost every
  satellite. That looks like an unfinished idea in IULR, or a deliberate choice to show full names in the
  compact layout. Kept as a flag.
