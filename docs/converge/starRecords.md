# starRecords

One function, `engine/functions/starRecords.js`.

- A system with `stars` (IULR) lists them by designation, with tint, tag and description derived from
  the spectral class. The wording is in the slots `starTagClassPrimary`, `starTagClassOuter`,
  `starNoteSingle`, `starNotePair` and `starNoteOuter`.
- A system with `primaries` lists them by name. Tags are the slots `starTagCentral`,
  `starTagBinary`, `starTagTrinaryInner`, `starTagTrinaryOuter`, `starTagBlackHole` and
  `starTagBlackHoleCompanion`. UACS sets its own wording in `bundle.json`.
- Tint comes from `starColors[i]`, `stellarColor` or `starColor`, then from the body type.
- Description comes from `primaryDescriptions[i]`, then a generated sentence.
- Flag `starRecordsFromSystem` (UACS): a record is built from the primaries alone, with the system's
  description and source.

Defaults for the slots are in `engine/bundle.json` under `defaults.stellar.slots`.
