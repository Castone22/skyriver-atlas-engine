# systemArticleTitle

Converged to `engine/functions/systemArticleTitle.js` (was two variants).

IULR uses a charted system's own `articleTitle` (`Kraunveld system`); the other four ignore it and
use the generated title (`<name> System`). This cannot be data-gated: every charted system in
Calidor, Elysian, Kadaym and UACS has an `articleTitle` (the bare name, for example `Varro`) that
differs from the generated `Varro System`, so honouring it everywhere would change their links.

**Flag** `systemRecordArticleTitle` (on for IULR): a charted system's own `articleTitle` is used
instead of the generated title.

## Questions

- Is it intended that four atlases link systems to `<name> System` while their data says
  `articleTitle: <name>`? If those `articleTitle` values are the star article and the system article
  is `<name> System`, the current behaviour is right and the flag is the right shape. If they were
  meant to be used, turn the flag on there (it would change link targets).

## Update (decision 2)

The flag `systemRecordArticleTitle` is gone. A charted system's article is `<name> System` unless its
`articleTitle` was set on purpose, meaning it differs from the name ignoring apostrophe style
(`Ouua System`, `Kraunveld system`, or `X (system)`), in which case it is used as written. Four
atlases carry an `articleTitle` that is just the name; that is treated as unset. Kadaym's stored system
images are keyed `<name> System`, which confirms the default. No atlas output changed.
