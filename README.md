# Skyriver Atlas Framework

Data-driven atlases for the Skyriver Codex. Each atlas is a bundle of data and page parts. A shared
engine supplies the code. A build writes self-contained HTML to `dist/`. A browser loader assembles the
same bundles for the AtlasEmbed wiki extension.

Start with `docs/HANDOFF.md`. Rules for changing the code are in `AGENTS.md`.

## Commands

Node.js 22 or newer. Run `npm install` once.

| Command                 | Action                                                   |
| ----------------------- | -------------------------------------------------------- |
| `npm run build`         | Write `dist/*.html`                                      |
| `npm run serve`         | Serve `dist/` at `http://127.0.0.1:8080/`                |
| `npm run check`         | Build, unit tests, DOM tests, quick golden tours (4 min) |
| `npm run check:full`    | Build, unit tests, DOM tests, full golden tours (10 min) |
| `npm run e2e`           | Browser tests in Chromium (Playwright), about 7 minutes  |
| `npm run e2e:update`    | Rewrite the browser-test baselines and screenshots       |
| `npm run golden:update` | Rewrite the jsdom golden hashes                          |
| `npm run build:loader`  | Build the browser loader, `build/loader.html`            |
| `npm run format`        | Format with Prettier                                     |

## Layout

| Path            | Contents                                                                 |
| --------------- | ------------------------------------------------------------------------ |
| `bundles/<id>/` | One atlas: `bundle.json`, `atlas.json`, shell, CSS, runtime script       |
| `engine/`       | Engine manifest, shared page functions, flag registry (`flags.json`)     |
| `src/`          | DSL, compiler core, Node host, bundle model, template engine, store      |
| `maps/`         | Authoring entry points, one per atlas                                    |
| `assets/`       | Images named by SHA-256                                                  |
| `loader/`       | Browser loader page                                                      |
| `tools/`        | Build, check, golden-tour, function-index and refactoring tools          |
| `tests/`        | Unit tests, DOM tests, golden tours                                      |
| `dist/`         | Generated HTML                                                           |
| `docs/`         | Design and procedure docs; `docs/history/` holds the original extraction |

## Per-atlas differences

The atlases share one set of functions. Each difference is configuration:

- **Flags**: capabilities, listed in `engine/flags.json`, enabled per atlas in `bundle.json`.
- **Policies**: numbers such as label thresholds, zoom and legend colours, in `atlas.json`.
- **Slots**: wording and file names, in `bundle.json`, written `{{name|filter}}` in shells and functions.
- **Data**: aliases, kickers, descriptions and other content, in `atlas.json`.
- **Hooks**: functions an atlas defines under an agreed name, called by the shared functions.

`docs/CONVERGING.md` is the procedure for merging function variants. `docs/converge/` holds the notes
per function and the maintainer decisions.

## Engines

An engine bundle has an `id`, a `version` and the `kinds` of atlas it renders (`stellar`, `geographic`,
`galaxy`). An atlas bundle has a `kind` and an `engine` version range. The compiler checks both.
Several engines can be stored side by side. See `docs/BUNDLES.md`.

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

`renderer` names the bundle that supplies the shell, styles, runtime and defaults. Save the module as
`maps/my-atlas.atlas.mjs` and build it:

```sh
node tools/build.mjs maps/my-atlas.atlas.mjs dist
```

The callbacks run while authoring. The result is plain JSON. A region without an `outline` gets a
beveled outline around its systems.

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

The store writes JSON files with a revision number, takes a lock, and replaces files atomically. A stale
`expectedRevision` raises an error. A crash can leave a `.lock` file to remove by hand.

A built stellar atlas exposes `window.AtlasFramework`:

- `exportJSON()` returns the catalogue.
- `navigate({ system: 'virezk', planet: 'Mahanzk' })` moves to a location.

## Stellar features

```js
.feature('index', { collapsed: true })
.feature('motion', { paused: true })
.feature('labels', {
  overview: { active: [160, 220], other: [220, 320] },
  regional: { active: [64, 80], other: [80, 125] }
})
```

Each pair is `[system-name percent, planet-sublabel percent]`, scaled to the viewport. Kadaym uses its own
thresholds (a bundle `capabilities` entry). Moons, stations, exotics and Silent status come from records.

## Assets and map types

- `node tools/asset.mjs image.png` imports an image and prints its `atlas-asset:…` reference, for
  `.asset('flag', reference)` or `.texture(reference)`. Builds embed the bytes; the loader serves them by URL.
- `Atlas.geographic()` takes `.place(id, props)`, `.texture(uri)` and
  `.terrain({boundaries, palette, contours, labelOffsets})`. The Mahanzk renderer uses a 2048 × 1078
  coordinate system. Places have a stable `key`, a renderer ordinal `id` and an optional `articleTitle`.
- `Atlas.galaxy()` takes `.empire(id, {name, article, position, color, map})`, `.background(uri)` and
  `.zone(props)`. `map` names a stellar bundle in `bundles/`. Grand builds child snapshots and search
  indexes from those bundles and keeps its affiliation baseline separate.

Location names link to Skyriver Codex articles, including pages not yet written.

## Wiki loader

`tools/build-loader.mjs` builds one HTML document that fetches an engine and an atlas bundle over HTTP
and renders the atlas in the browser, inside the AtlasEmbed sandbox. The contract is
`docs/TRANSPORTS.md`. The extension requirements are `docs/EXTENSION-BRIEF.md`.

## Tests

- **Unit tests** (`tests/*.test.mjs`): DSL, bundles, flags, templates, transport, compiler core, widget mode.
- **DOM tests** (`tests/dom.cjs`, `tests/iulr-dom.cjs`): navigation, schematics, search and the IULR
  title synchronisation in jsdom.
- **Golden tours** (`tests/golden.cjs`): every region, system, planet, satellite and station, the
  station screens, and the page controls. Each step is hashed and compared with `tests/golden/`.
  `quick` samples one step in ten; `full` runs all.
- **Browser tests** (`tests/e2e`, `npm run e2e`): Playwright in Chromium, after `npx playwright install chromium`.
  `tour.spec.mjs` runs the same tour as the golden tours with real layout and compares a hash of the page
  after each step. `screens.spec.mjs` compares screenshots of the overview, a region, a system and a
  planet of each atlas, which covers CSS and layout. Baselines are in `tests/e2e/__snapshots__/`.
  The step list is shared with the golden tours (`tests/tour-steps.mjs`).

Checked by hand: saved history state, hash routes, live Codex refresh.

`dist/build-report.json` lists four unresolved Kadaym references from the source catalogue
(`docs/history/MIGRATION.md`). New DSL maps use strict validation.
