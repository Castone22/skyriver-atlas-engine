# Handoff notes

A snapshot for someone picking this up. Everything is committed; `git log` has the history.

## Run it

Node 22 or newer.

```sh
npm install            # dev dependencies (jsdom, playwright, babel, prettier)
npm run build          # writes dist/*.html (open dist/index.html, or `npm run serve`)
npm run check          # build + unit + DOM tests + quick golden tours (about 4 minutes)
npm run check:full     # the same with the full golden tours (about 10 minutes, uses a lot of memory)
```

Run at most two golden tours at once (`--jobs 2`); each is a jsdom page and they are heavy.
`dist/` is already built, so the atlases open without any of this.

## Layout

| Path | What |
| --- | --- |
| `bundles/<id>/` | One atlas: `bundle.json` (manifest, flags, slots), `atlas.json` (data), shell, CSS, `runtime-0.js` |
| `engine/functions/` | Shared page functions; `engine/flags.json` is the registry of capability flags |
| `src/` | Compiler (`compile-core.mjs` is pure), bundle model, template engine |
| `tools/` | `check.mjs`, `dedup-lab.mjs`, `dedup-normalize.mjs`, `rename-global.mjs`, `index-functions.mjs`, loaders |
| `tests/golden/` | The contract: a hash of the rendered page for every step of a tour of each atlas |
| `docs/` | `BUNDLES.md` (design), `TRANSPORTS.md` (wiki loader), `CONVERGING.md` (procedure), `converge/` (notes) |

## Read first

1. `AGENTS.md`: the rules, including backward compatibility and how to converge function variants.
2. `docs/BUNDLES.md` and `docs/TRANSPORTS.md`: the engine/atlas bundle design and the AtlasEmbed side.
3. `docs/converge/DECISIONS.md`: answers to the open questions, and which are not yet implemented.

## Where it stands

- The seven atlases are bundles; the compiler core takes everything environmental from a host and
  runs in a browser. A loader page and HTTP transport exist (`loader/`, `src/bundle-http.mjs`).
- Function variants went from 378 files to 244. 48 capability flags; each is off by default and
  turned on only in the atlas that had the feature, so every atlas renders as before.
- 14 function groups still have more than one variant: `mountSystem`, `systemView`, `renderDetail`,
  `draw`, `scaleLabels`, `labelThresholds`, `renderIndex`, `starRecords`, `zoom`, and the per-atlas
  title hooks (`planetName`, `planetArticle`, `planetAliases`, `syncPlanetTitles`, `stationHasOverview`).
  Details are in `docs/converge/<name>.md`.

## Things to know

- A converged function is finished only when the **full** golden tours pass. The quick tours sample
  about one step in ten and have missed a regression before.
- The tours check structure and text, not CSS, and they do not drive widget mode (`?view=widget`),
  saved history state or hash routes. Check those by hand.
- `npm run golden:update` rewrites the golden files. Only use it for a change you intend, after
  reading which steps changed.
- Not done: the maintainer decisions in `docs/converge/DECISIONS.md` marked as pending; moving the
  remaining shell wording into slots and an engine-default shell; the PHP extension side.
