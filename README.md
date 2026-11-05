# Skyriver Atlas Framework

A working JavaScript DSL, JSON catalogue format, shared renderer source, and build pipeline extracted from the latest retrieved Kadaym, Elysian, UACS, IULR, Calidor, Grand, and Mahanzk atlases.

See docs/HANDOFF.md for the current state and how to run the checks.

Map authors edit `bundles/` (and `maps/`). Renderer developers edit `engine/`. Builds produce portable, self-contained HTML in `dist/` for the existing Codex embedding workflow. Generated HTML contains the final bundle by design; it is no longer the source of truth.

## Run it

Requires Node.js 22 or newer. Building and the core tests use only Node's standard library. The DOM tests, browser tests, migration tools and formatter need `npm install`; `npm run test:all` runs the core and DOM suites, and `npm run format:check` verifies formatting.

```sh
node tools/build.mjs
node --test tests/*.test.mjs
node tools/serve.mjs
```

Open `http://127.0.0.1:8080/`. Alternatively, open an individual file in `dist/` directly. Online article refreshes still depend on Codex availability and browser cross-origin rules.

The package includes rebuilt HTML, so you can inspect the atlases before running a build. Existing published atlases have not been overwritten or deployed.

## Define an atlas

```js
import { Atlas } from '../src/atlas.mjs';

export default Atlas.stellar({
  id: 'my-atlas',
  title: 'My Stellar Atlas',
  article: 'My Territory',
  renderer: 'elysian'
})
  .feature('index', { collapsed: true })
  .region('outer-reach', { name: 'Outer Reach' }, (region) =>
    region.system('example', { name: 'Example', x: 400, y: 350 }, (system) =>
      system.planet('Example III', { orbitalPosition: 3 }, (planet) =>
        planet
          .moon('Example III a', { visibility: 'system' })
          .station('Example Dock', { category: 'Habitation', major: true })
      )
    )
  )
  .build();
```

These are demonstration names, not additions to Skyriver canon. Save this module as `maps/my-atlas.atlas.mjs`, then run:

```sh
node tools/build.mjs maps/my-atlas.atlas.mjs dist
```

Callbacks run only while authoring. The result is plain JSON: no renderer functions, closures, DOM nodes, or executable strings are stored. Missing region geometry receives a simple beveled outline around its systems; supply an explicit `outline` for designed, contiguous borders.

## What is separated

| Location                   | Responsibility                                                                                             |
| -------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/atlas.mjs`            | Fluent DSL, JSON validation, relationships, article URLs                                                   |
| `src/compiler.mjs`         | Renderer linking, asset embedding, portable HTML output                                                    |
| `src/store.mjs`            | JSON persistence with revisions and atomic replacement                                                     |
| `maps/*.atlas.mjs`         | Authoring entry points                                                                                     |
| `bundles/<id>/`            | One atlas bundle: `bundle.json`, `atlas.json` (catalogue, geometry, notes), shell, CSS and runtime scripts |
| `assets/`                  | Deduplicated images, addressed by SHA-256                                                                  |
| `engine/functions/`        | Shared source functions and explicitly retained behavioral variants                                        |
| `engine/bundle.json`       | Engine bundle manifest (version, supported kinds)                                                          |
| `engine/capabilities.json` | Preserved capabilities and supported feature settings                                                      |
| `dist/`                    | Generated HTML; rebuild after source edits                                                                 |
| `docs/`                    | Design docs. `docs/history/` holds the original extraction records                                         |

The renderer linker resolves shared function references at build time. It does not use browser `eval`, fetch source code, or require a server-side renderer. This preserves the lexical dependencies of the original renderers while making a shared-function fix propagate to every profile that uses it.

## Store and reload

```js
import { FileAtlasStore } from './src/store.mjs';
import { Atlas } from './src/atlas.mjs';
import definition from './maps/elysian.atlas.mjs';

const store = new FileAtlasStore('./catalogue');
const saved = await store.save(definition, { expectedRevision: 0 });
const loaded = await store.load(definition.id);
const edited = Atlas.fromJSON(loaded.definition)
  .update('systems', 'varro', { description: 'Updated description.' })
  .build();
await store.save(edited, { expectedRevision: saved.revision });
```

The storage directory is your choice. Omit `expectedRevision` only when deliberately allowing replacement of the latest local revision. A concurrent writer causes an error; failed writes do not replace the previous JSON. A process crash can leave a `.lock` file; confirm no writer is active before removing that lock.

`JSON.stringify(definition)` and `Atlas.fromJSON(json)` also work without the file store. In a built stellar atlas, `window.AtlasFramework.exportJSON()` exports an authored catalogue snapshot, and `navigate({system:'virezk', planet:'Mahanzk'})` uses the existing navigation behavior.

## Features and renderer profiles

The specialized renderers remain explicit because they differ in behavior, not merely branding. They share matching implementations; a variant is retained when changing it could alter an existing atlas.

| Profile   | Distinctive retained behavior                                                                             |
| --------- | --------------------------------------------------------------------------------------------------------- |
| `kadaym`  | Federation overview, native label thresholds, classified holdings and Silent entities                     |
| `elysian` | Live planet article titles, Circa’s Triad and TORA schematics                                             |
| `uacs`    | Live planet article titles and Solar System analogue glyphs                                               |
| `iulr`    | Live planet article titles, cloak effects, TORA arrays, register data and independent region highlighting |
| `calidor` | Foundry and TORA schematics                                                                               |
| `grand`   | Galaxy discovery/search, current child snapshots, Drayson/Kevak priority                                  |
| `mahanzk` | Globe/cloud descent, surface geography, terrain and place selection                                       |

This is a shared-source framework with compatibility profiles, not a claim that every specialized feature is already interchangeable between all profiles. Page-ID-backed planet title updates are retained in Elysian, UACS and IULR v9. The other profiles preserve their actual source behavior. Read `docs/ARCHITECTURE.md` before changing a variant's contract.

Configurable stellar features:

```js
.feature('index', { collapsed: true })
.feature('motion', { paused: true })
.feature('labels', {
  overview: { active: [160, 220], other: [220, 320] },
  regional: { active: [64, 80], other: [80, 125] }
})
```

Each pair is `[system-name percent, planet-sublabel percent]`. Smaller viewports scale thresholds to available space. Kadaym retains its native threshold implementation and rejects a custom `labels` feature instead of silently ignoring it. Unknown feature switches also fail. Moons, stations, exotics and Silent status are driven by records rather than boolean switches.

## Assets and other map types

Import a local image with `node tools/asset.mjs image.png`. It prints an `atlas-asset:…` reference for `.asset('flag', reference)` or `.texture(reference)`. Builds embed the bytes. Data URLs and external URLs also remain supported; use the asset importer when offline portability matters.

`Atlas.geographic()` supports `.place(id, props)`, `.texture(uri)`, and `.terrain({boundaries, palette, contours, labelOffsets})`. The Mahanzk renderer uses a 2048 × 1078 cartographic coordinate system. Its default terrain and globe texture are inherited unless replaced. Geographic places have a stable `key` and a renderer ordinal `id`; an explicit `articleTitle` controls their Codex link.

`Atlas.galaxy()` supports `.empire(id, {name, article, position, color, map})`, `.background(uri)`, and `.zone(props)`. `map` names a stellar catalogue under `data/`, or the caller may pass compiled dependencies to `compile()`. Grand Atlas builds generate child snapshots and search indexes from the current stellar catalogues. Its original affiliation baseline remains separate so a later affiliation transfer can still override the default Drayson/Kevak rule.

All location names retain matching or intended Skyriver Codex article destinations, including pages that do not yet exist. Existing reference-page/section links remain intact.

## Verification and limits

Core tests cover DSL relationships, JSON round trips, validation, revision conflicts, catalogue counts, script escaping and generated builds. DOM tests cover navigation in all five migrated stellar atlases plus a newly authored DSL atlas, Triad/Foundry/TORA schematics, article page-ID moves, geographic place selection, and Grand Atlas search, regenerated snapshots and priority rules.

Run optional integration tests after installing development dependencies:

```sh
npm install
npm run test:dom
npm run test:iulr-dom
npx playwright install chromium
npm run test:browser
```

DOM tests passed with mocked canvas and SVG geometry. They are not visual rendering tests. Chromium could not launch in the execution environment, and its separate browser could not reach the local preview. Visual browser verification and live Codex API refresh testing remain outstanding. The live Codex page was unavailable during this run; the retrieved atlas files are the implementation source of truth.

Four unresolved Kadaym references already exist in the source catalogue. They are reported in `dist/build-report.json` and documented in `docs/MIGRATION.md`; migration preserves them rather than inventing replacements. New DSL maps use strict validation by default.

## IULR v9 integration update

The IULR renderer now includes the standalone v9 planet-name synchronization. It keeps original planet names until an article is discovered, then displays its canonical title. Cached page IDs follow later moves without redirects. Returning to the tab, reconnecting, the Refresh data button and visible-tab polling refresh titles. Offline use keeps cached titles or original names. Catalogue keys and navigation remain stable.

Both `dist/iulr-atlas.html` and Grand Atlas's embedded IULR snapshot were rebuilt. The other six atlas definitions and the five unrelated built atlases are unchanged. No live deployment or wiki edit was made.

The update passed the core and synchronization tests, the full-atlas DOM scenarios and the focused IULR DOM scenarios (`npm run check` now runs these plus the golden tours; see `docs/HANDOFF.md`). Grand's IULR snapshot is byte-identical to the rebuilt IULR HTML. See `docs/IULR-V9-UPDATE.md` for test scope and limitations. Visual browser and live Codex API/CORS verification remain unverified.
