# Noteworthy bodies

`noteworthy: true` marks a planet, moon or station that is named on the chart and listed in the system's
index row. The star cannot be marked. `noteworthyBodies(s)` returns a system's marked bodies: planets,
then moons, then stations. An unmarked body is not noteworthy.

- **Chart:** the names under a system's star are the first two noteworthy bodies.
- **Index row:** lists the noteworthy bodies; with none, "N catalogued planets".
- **Filter:** "major only" hides a system with no noteworthy body.
- **Search:** unaffected. Every body is searchable whether it is marked or not.

A planet with the default name (`<system> <numeral>`) is not marked; a planet with a name of its own is.
This replaces the three list fields `overviewWorlds` (Elysian), `mapWorlds` (UACS) and `namedWorlds`
(IULR), and the policies `draw.worldListField` and `draw.worldListGatesLabel`.

Also removed from the data in the same step: `creative`, `proposed`, `atlasExpansion`, `sourceStatus`,
`satelliteSourceStatus` and `hostBodyId` (nothing read them). `satelliteExpansion` is now
`ownSatelliteCount`.
