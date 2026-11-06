# Bundle design: engine bundles and atlas bundles

Status: proposal. Nothing here is implemented yet.

HTTP transport, the browser host, the loader page and the serving contract: see `docs/TRANSPORTS.md`.

## Goal

The engine must not know which atlas it is serving. An atlas is a self-contained **atlas bundle**.
The engine is a separately distributed **engine bundle** that supplies defaults and the compiler.
Both are uploaded to (and served from) a MediaWiki installation by a trusted extension.

```
engine bundle  +  atlas bundle  (+ dependency atlas bundles)  →  standalone HTML
```

## Principles

1. The engine contains **no atlas names, brands, titles or per-atlas data**. Anything that varies by atlas lives in that atlas's bundle.
2. An atlas bundle may supply a shell, a style and function extensions, but **none are required**. Absent parts fall back to engine defaults.
3. The bundle is a **file tree**. Zip files, tarballs, directories, release URLs and wiki pages are interchangeable _transports_ that all load into the same in-memory tree.
4. `compile()` is a **pure function over in-memory trees**. It performs no file or network I/O, so it can run in Node (CLI, server) or in a browser.
5. Bundles are trusted-author input (only trusted wiki users can edit the `MediaWiki:` namespace). Loaders still validate structure, paths and hashes, because that catches mistakes, not because they defend against attackers.

## Bundle tree model

A bundle is a map of normalized relative path → bytes. Paths use `/`, are lowercase-insensitive-unique, and may not contain `..`, absolute prefixes or backslashes.

### Atlas bundle

```
bundle.json            required   manifest
atlas.json             required   the atlas definition (kind, meta, data, policies, constants, presentation)
shell.html             optional   overrides the engine's default shell for this kind
style.css              optional   overrides/extends the engine's default style (see "parts")
functions/*.js         optional   function overrides, keyed by function name
assets/<sha256>.<ext>  optional   binary assets embedded in the bundle
```

`bundle.json`:

```json
{
  "bundleVersion": 1,
  "type": "atlas",
  "id": "kadaym",
  "version": "1.0.0",
  "engine": "^1.0.0",
  "kind": "stellar",
  "brand": "United Federation of Kadaym",
  "dependencies": { "children": [] },
  "parts": {
    "shell": "replace",
    "style": "extend",
    "functions": ["mountSystem", "highlightPart"]
  },
  "capabilities": { "labels": false },
  "assets": { "<sha256>": { "file": "assets/<sha256>.webp", "mime": "image/webp" } }
}
```

- `parts` declares what the bundle supplies and how it combines (`replace` or `extend` for style and shell, an explicit list for functions). The loader rejects a file that isn't declared and a declaration with no file.
- `brand` is data. The engine renders it through `{{brand}}` slots, never by string-matching renderer text.
- `capabilities` is how an atlas states restrictions that are hardcoded today (for example, Kadaym not supporting configurable label thresholds). The compiler checks the manifest, never an atlas id.
- `dependencies.children` replaces the hardcoded "build grand last" rule. Grand lists the atlas ids it composes; the host resolves them and the compiler orders builds topologically.
- `assets` entries are optional. An atlas may omit them and rely on the host's asset resolver (see below).

### Engine bundle

```
bundle.json            required   manifest
kinds/<kind>/shell.html     default shell per atlas kind (stellar, geographic, galaxy)
kinds/<kind>/style.css      default style
kinds/<kind>/runtime/*.js   ordered runtime scripts with @atlas-function markers
functions/*.js         shared function library (named variants allowed)
capabilities.json      hook points and what each kind supports
schema/atlas.schema.json
```

```json
{
  "bundleVersion": 1,
  "type": "engine",
  "version": "1.0.0",
  "kinds": ["stellar", "geographic", "galaxy"]
}
```

The engine bundle contains the compiler's data inputs, not atlas content. Today's seven `engine/profiles/<atlas>/` directories become, over time, one default renderer per kind plus the overrides that live in each atlas bundle.

## Resolution rules

For each atlas, in order:

1. **Shell:** the atlas's `shell.html` if declared, else `kinds/<kind>/shell.html`.
2. **Style:** engine default CSS, then the atlas's `style.css` appended (`extend`) or substituted (`replace`).
3. **Runtime:** the engine's ordered runtime for the kind. `@atlas-function name` markers resolve to the atlas's `functions/name.js` if declared, else the engine's `functions/name.js`.
4. **Policies and constants:** engine defaults for the kind, then the atlas's own values on top.
5. **Brand and titles:** from the atlas manifest/meta through template slots.

Overrides are explicit and declared. A function is never replaced because of a filename coincidence.

## Transports

Each transport is a small loader returning the same `Map<path, Uint8Array>`:

| Transport              | Use                                                                |
| ---------------------- | ------------------------------------------------------------------ |
| Directory              | Authoring and tests                                                |
| HTTP directory | Primary: base URL + manifest `files` list (sha256 each); stored unzipped by the extension |
| Release URL            | GitHub/Forgejo release asset, pinned by version and sha256         |
| `MediaWiki:` page tree | e.g. `MediaWiki:Atlas/kadaym/atlas.json`, `.../shell.html`, ...    |

Notes:

- Archives (zip, tar.gz) are handled by the wiki extension on upload; the engine reads only unpacked trees.
- Wiki text pages cannot hold large binaries. Assets referenced by hash are resolved from the bundle's `assets/` first, then from a host-supplied `resolveAsset(sha256)` (for example backed by `File:` uploads).
- Engine selection: a host pins an engine release by version and sha256. An atlas's `engine` range is checked against it at load time with a clear error.

## Compiler API (target shape)

```js
const engine = await loadBundle(source); // transports -> tree + validate
const atlas = await loadBundle(source);
const result = compile({
  engine,
  atlas,
  children, // Map<id, compiled result> for galaxy atlases
  resolveAsset // optional (sha256) => {mime, bytes}
});
// result.html, result.definition, result.warnings
```

No `fs`, no globals, no atlas ids. `loadBundle` is the only place that touches transports.

## Status after step 2

Implemented: `src/bundle.mjs` (pure bundle model, manifest validation, version ranges),
`src/bundle-fs.mjs` (directory transport), and seven atlas bundles under `bundles/<id>/`. An engine
bundle manifest lives at `engine/bundle.json`. The compiler reads shells, styles, runtime scripts,
defaults and shared functions through bundles and checks each atlas's `engine` range against the
engine version. Output is byte-identical to before the move.

Where the code differs from the target design above:

- **`runtime` is a bundle part.** Each current atlas has an ordered `parts.runtime` list (the profile's
  forked runtime scripts). The target design keeps runtime in the engine per kind; that comes with the
  convergence in step 4.
- **`title`** in `bundle.json` is the gallery display name.
- **`renderer` names the bundle that supplies the parts.** An atlas definition's `renderer` is the id
  of the bundle whose shell, styles and runtime it uses, and whose `atlas.json` supplies default
  policies, constants and documents. For a shipped atlas that is its own id. A DSL atlas (for example
  `examples/new-stellar.atlas.mjs`) points at another bundle (`elysian`) and inherits from it. A real
  per-kind engine default will replace this.
- **Shared functions still live in `engine/functions/`.** Atlas bundles reference them by marker key;
  atlas-owned `functions/` overrides are not read yet.
- **Not yet in the manifest:** `dependencies.children` (Grand still declares children in `atlas.json`),
  per-file hashes (`files`), and bundle-local `assets`. Assets are still the shared `assets/` store.

## Status after step 3

The compiler is split in two:

- `src/compile-core.mjs` is pure. It imports only `atlas.mjs`, `template.mjs` and `bundle.mjs`, none
  of which use Node modules or globals, so it can run in a browser. `tests/pure.test.mjs` enforces
  this and also compiles from in-memory bundles to show the core depends only on its host.
- `src/compiler.mjs` is the Node host. `compile(definition, options)` and `writeAtlas` keep their
  signatures. `createNodeHost()` is exported for tests and tools.

`compileCore(definition, host, { strict, dependencies })` takes a host with:

| Member | Purpose |
| --- | --- |
| `engine()` | Promise of the opened engine bundle |
| `atlas(id)` | Promise of an opened atlas bundle, or `null` |
| `asset(sha256)` | Promise of a URL or `data:` URL for an asset. A wiki host can return a plain URL |
| `gzipBase64(text)` | Needed only to embed Grand child snapshots; its absence is a clear error |
| `loadSearch(code)` | Optional. Precomputes Grand's search seed; without it the seed is omitted |

A browser host would implement `engine`/`atlas` over the HTTP directory transport (step 5),
`gzipBase64` with `CompressionStream`, and leave `loadSearch` out (Grand's runtime builds its own index).
Browser gzip output is not byte-identical to zlib's, which only matters for the committed `dist/` files
and is why the CLI keeps zlib.

## Migration plan

Each step must leave `dist/` byte-identical to the previous step (diff the rebuilt output), and keep `npm run test:all` green.

1. **Remove atlas knowledge from code, with no layout change.** _Done._
   - Move the `['elysian','uacs','calidor']` policy-defaults rule, the Kadaym label rule, the Grand baseline and the gallery titles into data (`data/*.json` and `meta`).
   - Replace the "grand last" sort with a `dependencies.children` topological order.
   - Replace the `profile.brand` string substitution with template slots.
2. **Introduce the bundle tree model** _(done; see "Status after step 2")_ (`loadBundle`, validation, directory + tar.gz transports). Build the existing seven atlases into atlas bundles whose shell, style and runtime are the current profile files, declared as `replace`. Engine defaults are initially thin.
3. **Make `compile()` pure** (trees in, HTML out); move all I/O into loaders. _Done; see "Status after step 3"._
4. **Converge the forks.** Deduplicate the function variants (for example the six `mountSystem` copies) into engine defaults plus declared overrides, one function at a time.
5. **Wiki transports.** Release-URL loader first, then the `MediaWiki:` page-tree loader, implemented with the extension.

## Decisions

- **Compilation runs client-side.** `compile()` must run in a browser. That rules out `node:fs`, `node:vm` and `node:zlib` inside the compiler core. Grand's current uses of `gzipSync` (child snapshots) and `vm` (search indexing) need browser-capable replacements (`CompressionStream`, which is async, and a direct call to the search module). Node-only code stays in the CLI wrapper.
- **The wiki supplies assets.** Bundles may embed `assets/`, but the normal path is `resolveAsset(sha256)` backed by the wiki. In a client-side host the resolver can return a URL, so images need not be inlined as data URLs; inlining stays available for the standalone-HTML export.
- **The PHP extension owns storage and unpacking.** Bundles are stored unzipped in a directory and served over HTTP. The engine therefore needs no archive support: zip/tar handling belongs to the extension's upload path. The primary transport is an **HTTP directory loader**: it fetches `bundle.json` from a base URL, and the manifest lists every file with its sha256 (`files`), so the client fetches exactly those paths and verifies them. The directory transport is kept for the CLI and tests.

## AtlasEmbed integration

AtlasEmbed today stores one self-contained HTML file per slug outside the file repo and serves it from `Special:AtlasEmbed/<slug>` with `Content-Security-Policy: sandbox allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox` (no `allow-same-origin`), so the atlas runs as an opaque-origin document with no access to wiki cookies or DOM. Embedding is `<atlasembed slug=… query=… />` into an iframe. The bundle design keeps all of that.

- **Backward compatible.** The standalone HTML export stays a first-class output, because it is exactly what AtlasEmbed accepts today. Existing slugs keep working unchanged; bundles are an additional kind of slug.
- **A bundle slug serves a small loader page.** `Special:AtlasEmbed/<slug>` returns a tiny HTML host (same sandbox CSP) that loads the engine bundle and the atlas bundle over HTTP, runs `compile()` in the browser and renders. The loader forwards the page's query string, so deep links (`system=…&planet=…`) behave as they do now.
- **Everything stays sandboxed.** Bundle code, including atlas-supplied `functions/*.js`, runs inside the opaque-origin iframe, so even an atlas bundle that carries code cannot reach wiki session state. This is the real protection; editor trust is a second layer.
- **Sandboxed documents fetch cross-origin.** Without `allow-same-origin` the loader's origin is `null`, so bundle files must be served with `Access-Control-Allow-Origin: *` (they are public static files, no credentials). Test this early, including any `import()` or module loading, which also needs CORS.
- **Storage shape.** One directory per engine version (stored once, shared by every atlas) and one per atlas slug, each with `bundle.json` listing files and sha256. Engine bundles are large and identical across atlases, so browser caching is a major win over today's 1 to 8 MB per standalone file. The `atlasembed_file` table gains a type column (`html` or `bundle`) and an engine reference.
- **Revisions and caching.** Today re-uploading a slug overwrites it with no history, and `Special:AtlasEmbed/<slug>` is served with `Cache-Control: private, max-age=3600` and no cache busting. Bundles must not inherit that. Serve every file named in a manifest at an immutable, content-addressed URL (the sha256 is the cache key), and serve only `bundle.json` and the loader page with a short or revalidating cache. Keep engine releases immutable once stored, with each atlas choosing which stored engine it uses, so a bad engine release can be rolled back by pointing the atlases at the previous one.
- **Grand.** Child atlases are **live references to child slugs** on the same host, not embedded snapshots. The galaxy atlas lists child ids in `dependencies.children`. Grand's loader fetches each child's bundle by slug, compiles it in the browser, and hands the resulting HTML to the existing `adaptHTML` path, which loads it into a sandboxed `srcdoc` iframe. It does **not** point an iframe `src` at the child slug: `adaptHTML` has to rewrite the child document first (token bridge, in-memory storage shim, shared-chart policy, `<base target>`), and that is impossible for a document the parent did not build. Each child keeps its own isolated runtime. The standalone export may still embed snapshots, as today.

## Sandbox constraints

AtlasEmbed serves documents with `Content-Security-Policy: sandbox allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox` and no `allow-same-origin`, so the document has an opaque origin. Audit of the current engine against that:

- **Not used by any atlas:** `alert`/`confirm`/`prompt`, `<form>` submission, top navigation (`_top`, `window.top`). The blocked capabilities do not matter.
- **`localStorage`:** used by the IULR and UACS planet title/article caches, always inside `try/catch`, so it degrades to "no persistence" in the sandbox. Do not add code that depends on it surviving a reload. State that must persist belongs in the URL or an external API.
- **`postMessage`:** Grand's child bridge authenticates by `e.source` and a per-frame token, not by `event.origin`, which is correct here because the origin reads `"null"`. Keep it that way; never gate on origin.
- **Deep links** (`region`, `system`, `planet`, `object`, `view`, `chart`, `focus`, `station`) are passed through `query=` and have no registry. They are a public contract: renaming one silently breaks every wiki page that uses it. Treat them as frozen (see `AGENTS.md`).
- **Size:** the extension caps a slug at 20 MB (`$wgAtlasEmbedMaxBytes`). Standalone `grand-atlas.html` is about 8 MB; bundles remove most of that pressure.
- **Upload validation** today only checks for a leading `<!doctype html>`, `<body` and `</html>`. The standalone export satisfies it. Bundles need their own validation (manifest schema, paths, per-file sha256) in the extension.
- **Slug format** is `^[a-z0-9][a-z0-9-]{0,79}$` (no underscores). Atlas ids in bundles must use the same alphabet, because the id becomes the slug for child references.

## Engine versioning

Several engines can be stored side by side. An engine bundle has an `id` (for example a stellar
engine and, later, a surface-map engine), a `version` and the `kinds` of atlas it can render. An
atlas bundle declares its `kind` and an `engine` version range. **Which stored engine an atlas uses
is chosen when the atlas is uploaded or configured**, and can be changed later; that choice is how an
atlas is moved to a new engine release or pinned to an old one.

An engine is compatible with an atlas when its `kinds` include the atlas's `kind` and its `version`
satisfies the atlas's `engine` range. The compiler enforces both and fails with a clear message. A
galaxy atlas renders its child atlases with its own engine, so that engine must support the children's
kinds as well.

Because several atlases can share one engine, **backward compatibility is a standing requirement** for
engine changes. See `AGENTS.md`.

## Open questions

- None currently blocking.

## Status after step 4

Function variants were converged only where the difference is data that a slot can reproduce
exactly. `bundle.json` may carry a `slots` object of per-atlas strings; the compiler merges it into
the template values next to `brand`, and a slot value may itself use `{{brand}}`. Functions use
them as `'{{name|jsstr}}'`. Each merge was proven before it was applied: for every affected profile,
with its real brand and a hostile custom brand, the shared source renders to exactly the text that
profile's own variant rendered to. All nine default `dist/` outputs stayed byte-identical.

Merged (373 to 364 function files):

| Function | Profiles merged | Slots |
| --- | --- | --- |
| `downloadHTML` | Kadaym, IULR, Calidor | `downloadName` |
| `resolveRegion` | Elysian, UACS, IULR, Calidor | `overviewAlias` |
| `setView` | Elysian, UACS, Calidor | `overviewTitle`, `overviewSubtitle` |
| `renderIndex` | Kadaym, Calidor | `indexFirstSystem`, `indexHintAtlas` |
| `affiliationMarkup` | all five stellar profiles using it | `affiliationLink` |

Everything else stays as separate variants because the differences are logic, not data. Typical
causes: different helper calls (`planetName`, `planetLabel`, `planetDisplayName`,
`planetArticleName`), extra branches (Calidor's Foundry, IULR's outer-system zone and cloak status,
TORA schematics), Kadaym's federation-overview camera, different DOM handling, and markup or colour
differences. Variants that differ by a stray semicolon or whitespace (for example `leadInfobox`)
cannot be merged without changing some atlas's output bytes. A further reduction needs a deliberate
behaviour decision per group (for example one `planetName` helper contract), not mechanical slots.

## Status now

This supersedes the step-by-step status sections above, whose function and flag counts are out of date.

- Steps 1 to 5 of the migration plan are done: the seven atlases are bundles, the compiler core is pure,
  the HTTP transport and loader exist (`docs/TRANSPORTS.md`), and function variants have been converged
  (`docs/CONVERGING.md`).
- Function files: 378 originally, 244 now. 48 capability flags are registered in `engine/flags.json`,
  each off by default and set per atlas in `bundle.json`. 14 function groups still have more than one
  variant (list in `docs/HANDOFF.md`).
- The contract for behaviour is `tests/golden/`: a tour of every region, system, planet, satellite and
  station, plus the page's own controls. `npm run check` runs it in quick mode; a change is finished
  only when `npm run check:full` passes.
- Still open: the maintainer decisions marked pending in `docs/converge/DECISIONS.md`, the remaining
  shell wording as slots with an engine-default shell, and the extension side.
