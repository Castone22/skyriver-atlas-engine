# syncSystemFocus

Variants merged: calidor+elysian+iulr+uacs, kadaym (2 -> 1). Result: converged, no flags.

The only difference: four atlases show the station screen when `stationOverview` is set, Kadaym
always shows the system view. The converged function is the four-atlas form. Kadaym now declares
`let stationOverview=false;` in its runtime so the shared function can read it. Nothing in Kadaym
ever sets it, so Kadaym still always shows the system view and `stationScreen` (which Kadaym does
not link) is never called.

## Questions

None.
