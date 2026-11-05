# Migration ledger

Seven latest HTML source files were selected by modification time, preferring the newer numbered Kadaym and IULR copies over older unnumbered files. Exact Library identities, versions and timestamps are in `retrieved-sources.json`; original byte hashes and catalogue counts are in `source-manifest.json`.

| Atlas | Systems | World records | Satellites | Stations |
| --- | ---: | ---: | ---: | ---: |
| Kadaym | 188 | 234 | 420 | 79 |
| Elysian | 66 | 336 | 762 | 42 |
| UACS | 42 | 269 | 1,202 | 122 |
| IULR | 41 | 265 | 504 | 308 |
| Calidor | 53 | 89 | 197 | 59 |

Grand Atlas and Mahanzk retain their distinct galaxy and geographic models. Grand's embedded snapshots were older than the standalone sources for several empires; the generated snapshots now use the current migrated definitions.

## Changes at the source boundary

- `DATA` objects moved to JSON catalogues without deleting extension fields.
- Geography's place, terrain, contour and label-offset data moved to the definition.
- Galaxy scene settings, empire seeds and priority baseline moved to the definition.
- Embedded raster assets were deduplicated into the asset registry.
- Identical top-level functions are shared by profile reference.
- Map notes became presentation data; the shared renderer inserts them.
- Compatible label-policy implementations were consolidated and their thresholds became data.
- Runtime-created map contents were removed from hydrated HTML shells. SVG definitions and the scene container were retained.
- Site editor chrome and Cloudflare challenge scripts were omitted; they belong to the captured hosting page, not the atlas.
- Compilation adds the stellar host API and refreshes dropdown options from current data.

## Existing unresolved Kadaym references

The original system lists refer to Chorus, Corianna, Malvora and Ivory Vale without matching world, moon, station or entity records. These entries remain unchanged and are reported as migration warnings. No names, lore or planet records were invented to satisfy validation.

## What was verified

See `dom-results.json` and `verification.json`. Catalogue counts and complete object data were compared with the retrieved sources after resolving extracted asset references. DOM tests execute generated scripts against a DOM implementation, including overview/system/planet navigation and specialized schematics. Their canvas and geometry operations are mocked. Real-browser rendering, animation fidelity and live Codex API behavior were not verified in this environment.

## Repeat the extraction

The one-time extraction script requires `@babel/parser`; it uses a parser supplied by the execution environment only as a fallback. From the project root:

```sh
node tools/extract.cjs /path/to/retrieved-html-files
node tools/refine.mjs
node tools/build.mjs
```

The exact original filenames are recorded in the extraction tool. This command intentionally replaces the generated migration source, including catalogue modules; use it only for a new migration branch or a deliberate re-import. Normal authoring and renderer development do not use it. Repeat the full test suite after a re-import.
