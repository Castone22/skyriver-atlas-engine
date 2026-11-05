# solarLayout

Converged to `engine/functions/solarLayout.js` (5 variants -> 1). Elysian, UACS, Calidor and IULR
shared the same body and differed only in two selections; Kadaym differed in three smaller ways.

## Which stations the diagram draws: `policies.solarStations`

A station is drawn if it is not in `excludeNames` and either passes the mode test or has a category
in `categories`.

| Field | Meaning |
| --- | --- |
| `mode: "visibility"` | pass when `visibility === "system"`, or when it has no `visibility` and `unset` allows it |
| `mode: "systemMajor"` | pass when the station is flagged `systemMajor` |
| `unset` | for `visibility` mode and a station with no `visibility`: `"always"`, `"unlessUnimportant"` (not `important === false`) or `"never"` |
| `categories` | categories that are always drawn (`["TORA"]`) |
| `excludeNames` | names never drawn (`["Foundry"]`, which has its own schematic) |

| Atlas | Policy |
| --- | --- |
| Calidor | visibility, unset always, `TORA`, excludes `Foundry` |
| Elysian | visibility, unset unlessUnimportant, no categories |
| UACS | visibility, unset always, `TORA` |
| IULR | systemMajor, `TORA` |
| Kadaym | visibility, unset never, no categories |

## Flags

| Flag | Default | On for | Meaning |
| --- | --- | --- | --- |
| `solarMoonsVisibleOnly` | off | Calidor | list moons from `moonRecords`, only those visible at system level or inhabited, instead of every moon body |
| `solarLanesFromAllStations` | off | Kadaym | diagram width counts every station record's lane, not only the stations drawn |
| `solarIllustrativeGuard` | off | Kadaym | only add an illustrative planet whose kind exists in `illustrativeTypes` (the others assume it does and would throw) |

## Differences found to be equal

Kadaym handled "uncertain system with no planets" by `total = maxSlot`, the others by `0`; with no
planets `maxSlot` is `0`, so they are the same. Kadaym skips illustrative orbits for sparse systems
by `continue`; the others add them and filter out `synthetic` orbits afterwards. `illustrativePlanet`
always returns `synthetic: true`, so the result is the same (Kadaym also has no system that is both
sparse and schematic).

Remaining: nothing. Questions: the two guards differ in what they do for an unknown planet kind
(skip or throw). Kept as they were, behind `solarIllustrativeGuard`.
