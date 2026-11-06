# Skyriver Atlas Framework

A JavaScript DSL, JSON catalogue format, shared page engine and build pipeline for the Skyriver
atlases (Kadaym, Elysian, UACS, IULR, Calidor, Grand and Mahanzk). Each atlas is a small **bundle**
of data and page parts; the shared **engine** supplies the code. A build produces self-contained HTML
in `dist/`, and the same bundles can be assembled in the browser by a loader (for the AtlasEmbed wiki
extension).

New here? Read `docs/HANDOFF.md` first, then `AGENTS.md` for the rules for changing things.

## Run it

Node.js 22 or newer. Building needs nothing installed; tests and tools need `npm install`.

```sh
npm install
npm run build          # writes dist/*.html; open dist/index.html or run `npm run serve`
npm run check          # build + unit tests + DOM tests + quick golden tours (about 4 minutes)
npm run check:full     # the same with the full golden tours (about 10 minutes, memory hungry)
```

`dist/` is already built, so you can open the atlases without running anything. Live article refreshes
depend on the Codex wiki being reachable and on browser cross-origin rules.

## Layout

| Location            | Responsibility                                                                                                                                     |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `bundles/<id>/`     | One atlas: `bundle.json` (manifest, flags, slots), `atlas.json` (catalogue, geometry), shell, CSS, runtime                                         |
| `engine/`           | The engine bundle: `bundle.json`, shared page functions (`functions/`), the flag registry (`flags.json`)                                           |
| `src/`              | The DSL (`atlas.mjs`), the pure compiler (`compile-core.mjs`), its Node host (`compiler.mjs`), the bundle model, the template engine and the store |
| `maps/*.atlas.mjs`  | Authoring entry points that build a bundle's definition                                                                                            |
| `assets/`           | Deduplicated images, addressed by SHA-256                                                                                                          |
| `loader/`, `tools/` | The browser loader and the build, check and refactoring tools                                                                                      |
| `tests/`            | Unit and DOM tests, and `golden/`: a hash of the rendered page for every step of a tour of each atlas                                              |
| `dist/`             | Generated HTML; rebuild after source edits                                                                                                         |
| `docs/`             | Design and procedure docs; `docs/history/` holds the original extraction records                                                                   |

The compiler links shared function files into each atlas's page at build time. It does not use browser
`eval` or fetch source code. Nothing in `src/compile-core.mjs` touches Node APIs, so the same compiler
runs in a browser.

## How an atlas differs from another

Atlases share one set of functions. Behaviour that only some atlases want is **configuration**, not
copied code:

- **Flags** (`engine/flags.json` lists them all; `bundle.json` `flags` turns them on per atlas) switch
  capabilities such as region highlighting or station schematics. Every flag is off unless an atlas
  turns it on, so an atlas only gets what it had before.
- **Policies** in `atlas.json` hold numbers (label thresholds, zoom, legend colours).
- **Slots** in `bundle.json` hold per-atlas wording and file names, used as `{{name|filter}}` in shells and
  functions.
- **Data** holds content: aliases, kickers, descriptions. Code never names a particular system.
- **Hooks**: a small function an atlas defines under an agreed name (for example how it resolves a planet's
  display title), which the shared functions call.

`docs/CONVERGING.md` is the procedure for merging function variants this way, and `docs/converge/` has
the notes for each function and the maintainers' decisions.

Several engines can be stored side by side (for example a stellar engine and a surface-map engine). An
engine has an `id`, a `version` and the `kinds` of atlas it renders; an atlas declares its `kind` and an
`engine` version range, and the compiler refuses an incompatible pair. See `docs/BUNDLES.md`.

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

These are demonstration names, not additions to Skyriver canon. `renderer` names the bundle whose shell,
styles, runtime and defaults the atlas uses. Save the module as `maps/my-atlas.atlas.mjs`, then run:

```sh
node tools/build.mjs maps/my-atlas.atlas.mjs dist
```

Callbacks run only while authoring. The result is plain JSON: no renderer functions, closures, DOM
nodes or executable strings are stored. Missing region geometry receives a simple beveled outline
around its systems; supply an explicit `outline` for designed, contiguous borders.

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

The storage directory is your choice. Omit `expectedRevision` only when deliberately allowing
replacement of the latest local revision. A concurrent writer causes an error; failed writes do not
replace the previous JSON. A process crash can leave a `.lock` file; confirm no writer is active before
removing it.

`JSON.stringify(definition)` and `Atlas.fromJSON(json)` also work without the file store. In a built
stellar atlas, `window.AtlasFramework.exportJSON()` exports an authored catalogue snapshot, and
`navigate({system:'virezk', planet:'Mahanzk'})` uses the existing navigation behaviour.

## Stellar features

```js
.feature('index', { collapsed: true })
.feature('motion', { paused: true })
.feature('labels', {
  overview: { active: [160, 220], other: [220, 320] },
  regional: { active: [64, 80], other: [80, 125] }
})
```

Each pair is `[system-name percent, planet-sublabel percent]`. Smaller viewports scale thresholds to
available space. Kadaym keeps its native thresholds and rejects a custom `labels` feature instead of
silently ignoring it (a bundle `capabilities` entry). Unknown feature switches also fail. Moons,
stations, exotics and Silent status are driven by records, not switches.

## Assets and other map types

Import a local image with `node tools/asset.mjs image.png`. It prints an `atlas-asset:…` reference for
`.asset('flag', reference)` or `.texture(reference)`. Builds embed the bytes; the browser loader serves
them by URL instead. Data URLs and external URLs also work.

`Atlas.geographic()` supports `.place(id, props)`, `.texture(uri)` and
`.terrain({boundaries, palette, contours, labelOffsets})`. The Mahanzk renderer uses a 2048 × 1078
cartographic coordinate system; its default terrain and globe texture are inherited unless replaced.
Geographic places have a stable `key` and a renderer ordinal `id`; an explicit `articleTitle` controls
their Codex link.

`Atlas.galaxy()` supports `.empire(id, {name, article, position, color, map})`, `.background(uri)` and
`.zone(props)`. `map` names a stellar bundle under `bundles/`, or the caller may pass compiled
dependencies to `compile()`. Grand Atlas builds generate child snapshots and search indexes from the
current stellar catalogues. Its original affiliation baseline stays separate so a later affiliation
transfer can still override the default Drayson/Kevak rule.

All location names keep matching or intended Skyriver Codex article destinations, including pages that
do not exist yet.

## The wiki side

`loader/` and `tools/build-loader.mjs` produce one HTML document that fetches an engine and an atlas
bundle over HTTP and builds the atlas in the browser, inside the existing AtlasEmbed sandbox. Its
contract is `docs/TRANSPORTS.md`; what the MediaWiki extension must provide is
`docs/EXTENSION-BRIEF.md`.

## Verification and limits

`npm run check` builds everything and runs the unit tests (DSL, bundles, flags, templates, transport,
purity of the compiler core, widget mode), the DOM tests for all stellar atlases plus an authored DSL
atlas, and the golden tours. A tour drives every region, system, planet, satellite and station through
`AtlasFramework.navigate`, opens station screens, and uses the page's own controls (search, scope,
filters, zoom, panels, keys); the recorded hash of the rendered page after each step is the contract
for behaviour. `npm run golden:update` rewrites those hashes, which should only follow a change you
intend and have read the diff of.

What this does not cover: CSS and visual layout (the tours compare structure and text under mocked
geometry), saved history state and hash routes, and live Codex API refresh. Check those by hand, or with
`npm run test:browser` after `npx playwright install chromium`. Four unresolved Kadaym references
exist in the source catalogue; they are reported in `dist/build-report.json` and described in
`docs/history/MIGRATION.md`, and are preserved rather than invented. New DSL maps use strict validation
by default.

The history of the original extraction, including the IULR v9 title-synchronisation update, is in
`docs/history/`.
