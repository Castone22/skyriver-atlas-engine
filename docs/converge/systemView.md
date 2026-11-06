# systemView

One function, `engine/functions/systemView.js`. Wording is in slots, whose defaults are in
`engine/bundle.json`:

`goToStar`, `goToBlackHole`, `catalogHeadingWorlds`, `catalogHeadingStations`, `sampleKeyPlanet`,
`sampleKeyMoon`, `captionSparse`, `captionDense`, `captionExtended`, `captionPlain`,
`captionUnconfirmed`, `captionTail`, `moonNoun`, `stationNoun`, `summaryFacilities`,
`summaryDistant`, `orbitDocumented`.

Behaviour:

| Flag                     | Effect                                                                 |
| ------------------------ | ---------------------------------------------------------------------- |
| `summaryCountsAllMoons`  | the summary counts every moon record                                   |
| `familySystemSummary`    | the summary names binary and trinary systems; the belt toggle is never disabled |
| `facilityCountSummary`   | the summary gives `otherStationCount` and `toraCount`                  |
| `stationFilterHidesTora` | no TORA entry in the station-type filter                               |

A system's `chartNote` is appended to the summary. `foundryCorner` and `cloakDecoration` are used when
the atlas defines them. Planet names in the orbit-order buttons come from `planetName`.
