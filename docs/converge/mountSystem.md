# mountSystem

One function, `engine/functions/mountSystem.js`, serves every stellar atlas. It is the former
Elysian/Kadaym shared file plus the features of the Calidor, UACS and IULR variants.

## Features and where they are configured

| Feature                                                         | Configured by                                             |
| --------------------------------------------------------------- | --------------------------------------------------------- |
| Black-hole pair: ring radii, guide ellipse, mover offsets, glyph | `policies.blackBinary` (Calidor, UACS); other atlases use the single-black-hole sizes |
| Explicit orbit radii                                            | `orbitRadii` on the system                                |
| Solar-analogue layout and planet glyph                          | `solarAnalogue` on the system and its worlds              |
| Glow colour of the central star                                 | `starColor` on the system (default `#f9bd66`)             |
| Foundry glyph                                                   | `schematic: "foundry"` on the station, when `foundryGlyph` exists |
| Station binding to the station-overview screen                  | `stationHasOverview(b)`                                   |
| Planet titles in labels and tooltips                            | `planetName(name)`                                        |
| Derived belts                                                   | flag `derivedBelts`                                       |
| Body opacity from `renderOpacity`                               | flag `systemBodyRenderOpacity`                            |
| Stations of planets with `extendedSatelliteChart` left off the system chart | flag `hideExtendedHostStations`              |
| Cloud bands on `storm-bands` planets                            | flag `stormBands`                                         |
| Bodies with `renderOpacity` below 1 use the filler track and carry no label | flag `dimmedBodiesAreFiller`                 |
| First star filled with its own tint, not the sun gradient       | flag `flatStarFill`                                       |
| Heading, aria text, name prefix and classes of the row of bodies with no host orbit | slots `unlocatedHeading`, `unlocatedHeadingCompact`, `unlocatedHeadingClass`, `unlocatedNameClass`, `unlocatedAria`, `unlocatedNoun` |

## Decisions applied

- IULR uses the shared station drawing (decision 14). Its previous parent-or-lane station tracks and
  its "wide C" label are gone.
- Calidor's early return when the system view is not focused is removed (decision 16).
- Labels of proposed planets are always drawn, as in Elysian (decision 17). UACS no longer hides them
  until the Codex title is known.
- Elysian gains a `title` on the link of a station that opens a station overview, because
  `bindToraName` now binds in the row of bodies with no host orbit for every atlas that defines it.
