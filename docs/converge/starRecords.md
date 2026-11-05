# starRecords

**Partial.** Three of five variants merged into `engine/functions/starRecords.js`; UACS and IULR
stay separate.

## Merged: Elysian, Kadaym, Calidor

Calidor's variant is a strict superset of the other two for their data:

- its extra tint source `s.starColors?.[i] || s.stellarColor` is data-gated: Elysian and Kadaym
  systems have neither field;
- its black-hole condition `&& i === 0` only differs from `s.centralBodyType === 'black-hole'` for a
  black hole with several primaries. Elysian has no black holes and Kadaym's ten each have a single
  primary, so `i` is always 0.

No flags were needed.

## Left: UACS (`starRecords-2ae8652d7987`) and IULR (`starRecords-edf881d7ebd2`)

Different data models and wording, not drift:

- **UACS** builds records from `s.primaries` only (no `...own` spread), uses its own tag wording
  ("Outer stellar companion", "Inner binary component", "Binary component"), sets a `blackHole`
  property, reads `s.starColors[i] || s.starColor` and hard-codes the descriptions of one black-hole
  system in code ("DSC 346 B is the blue-white companion…").
- **IULR** reads a `stars` array of `{designation, spectralClass}` records (`s.stars`) and derives
  tint and description from the spectral class.

Merging them means choosing among three tag vocabularies and moving UACS's black-hole text into its
data; each changes visible text unless every string is made a data field. That is a larger content
change than this pass should make silently.

## Questions

- Should UACS's black-hole description (two sentences, one naming "DSC 346 B") move into that
  system's data, and should its tag vocabulary ("Inner binary component" etc.) be kept as is or
  unified with the other atlases' ("Trinary inner-pair star" etc.)? The wording differs by atlas
  today and this pass kept it.
