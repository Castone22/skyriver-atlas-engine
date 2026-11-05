# stationScreen

Variants merged: calidor, elysian+iulr+uacs (2 -> 1). Result: converged, no flags.

The two variants are identical except for the first branch. Calidor opens the Foundry screen when
the station is named `Foundry`; the others open the Triad screen when `st.schematic==='triad'`.
The converged function has both branches (Foundry first), guarded with `st?.`; everything else is
the shared TORA screen. `foundryScreen` and `triadScreen` are each linked only by the atlas that
has such a station, and each is only called for that station, so the others never evaluate them.

The shared TORA screen still holds TORA copy (the deck line, the specification table) in code; it
is unchanged and belongs to a content pass, not this convergence.

## Questions

None.
