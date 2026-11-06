# Handoff notes

A snapshot for someone picking this up. Everything is committed; `git log` has the history.

## Run it

Node 22 or newer.

```sh
npm install            # dev dependencies (jsdom, playwright, babel, prettier)
npm run build          # writes dist/*.html (open dist/index.html, or `npm run serve`)
npm run check          # build + unit + DOM tests
npm run check:full     # the same plus the browser tests (about 7 minutes)
npm run e2e            # browser tests alone: the tour plus screenshots
```

`dist/` is already built, so the atlases open without any of this.

## Layout

| Path | What |
| --- | --- |
| `bundles/<id>/` | One atlas: `bundle.json` (manifest, flags, slots), `atlas.json` (data), shell, CSS, `runtime-0.js` |
| `engine/functions/` | Shared page functions; `engine/flags.json` is the registry of capability flags |
| `src/` | Compiler (`compile-core.mjs` is pure), bundle model, template engine |
| `tools/` | `check.mjs`, `dedup-normalize.mjs`, `rename-global.mjs`, `index-functions.mjs`, loaders |
| `tests/e2e/` | The contract: a hash of the rendered page for every step of a tour of each atlas, plus screenshots |
| `docs/` | `BUNDLES.md` (design), `TRANSPORTS.md` (wiki loader), `CONVERGING.md` (procedure), `converge/` (notes) |

## Read first

1. `AGENTS.md`: the rules, including backward compatibility and how to converge function variants.
2. `docs/BUNDLES.md` and `docs/TRANSPORTS.md`: the engine/atlas bundle design and the AtlasEmbed side.
3. `docs/converge/DECISIONS.md`: answers to the open questions, and which are not yet implemented.
4. `docs/EXTENSION-BRIEF.md`: what the AtlasEmbed MediaWiki extension must change to serve bundles (self-contained; hand it to whoever works on the extension).

## Where it stands

- The seven atlases are bundles; the compiler core takes everything environmental from a host and
  runs in a browser. A loader page and HTTP transport exist (`loader/`, `src/bundle-http.mjs`).
- Function variants went from 378 files to 228. 64 capability flags; each is off by default and
  turned on only in the atlas that had the feature. Wording that differed by atlas is a slot, with its
  default in `engine/bundle.json`.
- An atlas bundle needs only `bundle.json` and `atlas.json`. The engine supplies a default shell, style,
  runtime, slots, flags and policies for each kind it lists under `defaults` (today, `stellar`).
  `examples/minimal-atlas` is built that way and is part of the browser tests.
- Station screens (TORA arrays, the Foundry, Circa's Triad) are one schematic view driven by a root
  `schematics` array in `atlas.json` (`docs/converge/schematics.md`). Other features that exist several
  times under different names are listed in `docs/converge/families.md`.
- Groups that still have more than one file: `draw` (3), `renderIndex` (2), `regionSystemSummary` (2,
  atlas hooks), and the planet-title hooks `planetName`, `planetArticle`, `planetAliases` and
  `syncPlanetTitles`. The title sync exists three times (Elysian, UACS, IULR); decision 15 makes
  Elysian's the one, which changes live behaviour that the tests cannot see. `zoom` has a second file
  that belongs to the surface-map renderer.

## Things to know

- A converged function is finished only when `npm run e2e` passes: the tour hashes and the screenshots.
- The browser tests do not drive saved history state or hash routes. Check those by hand. Widget mode
  (`?view=widget`) is covered by `tests/widget.test.mjs`.
- `npm run e2e:update` rewrites the baselines. Only use it for a change you intend, after reading which
  steps changed.
- Not done: one title-sync implementation (decision 15); default shell, style and runtime for the
  `geographic` and `galaxy` kinds; splitting the surface-map renderer into its own engine; the PHP
  extension side.
