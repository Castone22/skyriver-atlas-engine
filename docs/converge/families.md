# Fragmented families

Features that exist several times under different names. Schematics are done (`schematics.md`).

## Code

- **Glyphs**: `stationGlyph`, `foundryGlyph`, `blackHoleGlyph`, `deadStarGlyph`, `exoticGlyph`,
  `nefandumGlyph`, `solarPlanetGlyph`, and the tables `STATION_TYPES` and `STATION_SILHOUETTES`. One
  concept: a map symbol for a kind of body. Next step: a schematic's `glyph` as data (`hull`, `detail`,
  `color`, `symbol`), and the body-type glyphs as entries too.
- **Planet-title sync**: three implementations (`docs/converge/DECISIONS.md`, decision 15).
- **Infobox and image loading**: `leadInfobox`, `legacyInfobox`, `infoboxFile`, `fileFromInfobox`, `imageAPI`,
  `loadLiveImage`, `imageRecord`. Check whether the legacy parsers are still reached.
- **Concealed or hazardous objects**: `cloakDecoration`, `cloakBadge`, `silentDecoration`, `entityRecords`,
  `tierMarkup`, `TIER_NAMES`, `TIER_COLORS`.

## Data fields

| Idea                      | Names in use                                                                                   |
| ------------------------- | ---------------------------------------------------------------------------------------------- |
| Not published canon       | `creative`, `proposed`, `atlasExpansion`, `satelliteExpansion`, `sourceStatus`                 |
| Star colour               | `starColor`, `starColors`, `stellarColor`                                                      |
| Host of an orbit          | `parent`, `orbitHost`, `hostBodyId`, `lane`, `orbitalZone`, `orbitalPosition`, `diagramSlot`   |
| Source of a record        | `source`, `sourceNote`, `sourceStatus`, `sourceSection`, `satelliteSource`, `satelliteSourceStatus`, `referencePage`, `referenceSection`, `imageSource` |
| Other names               | `aliases`, `nickname`, `searchAliases`, `formerName`, `legacyName`, `catalogueDesignation`     |
| Capital                   | `capital`, `isCapitalSystem`, `capitalPlanet`, `capitalSystem`                                 |
| Worlds of a system        | `worlds`, `namedWorlds`, `mapWorlds`, `overviewWorlds`                                         |
| Body type                 | `type`, `bodyType`, `registerBodyType`, `planetKind`, `kind`                                   |
| Region labelling          | `labelAnchor`, `labelPosition`, `labelSize`, `watermarkAnchor`, `mapKicker`, `mapSubtitle`, `subtitle`, `summary` |
| Stored counts             | `stationCount`, `otherStationCount`, `toraCount`, `systemCount`                                |
| Concealment               | `cloaked`, `cloakStatusText`, `silentPresence`, `cordon`, `tier`, system `kind` of `classified`, `hazard`, `uncertain`, `neutral` |

Order suggested: glyphs, canon status, orbit host, star colour, aliases, sources.
