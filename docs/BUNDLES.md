# Bundle design: engine bundles and atlas bundles

Status: proposal. Nothing here is implemented yet.

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
| `.tar.gz` / `.zip`     | Distribution; uploads to the wiki                                  |
| Release URL            | GitHub/Forgejo release asset, pinned by version and sha256         |
| `MediaWiki:` page tree | e.g. `MediaWiki:Atlas/kadaym/atlas.json`, `.../shell.html`, ...    |

Notes:

- Node has no built-in zip reader. `.tar.gz` needs only `node:zlib` plus a tiny tar parser, so the zero-dependency property is kept. Accepting `.zip` as well means one small dependency (or a minimal reader); decide when implementing.
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

## Migration plan

Each step must leave `dist/` byte-identical to the previous step (diff the rebuilt output), and keep `npm run test:all` green.

1. **Remove atlas knowledge from code, with no layout change.**
   - Move the `['elysian','uacs','calidor']` policy-defaults rule, the Kadaym label rule, the Grand baseline and the gallery titles into data (`data/*.json` and `meta`).
   - Replace the "grand last" sort with a `dependencies.children` topological order.
   - Replace the `profile.brand` string substitution with template slots.
2. **Introduce the bundle tree model** (`loadBundle`, validation, directory + tar.gz transports). Build the existing seven atlases into atlas bundles whose shell, style and runtime are the current profile files, declared as `replace`. Engine defaults are initially thin.
3. **Make `compile()` pure** (trees in, HTML out); move all I/O into loaders.
4. **Converge the forks.** Deduplicate the function variants (for example the six `mountSystem` copies) into engine defaults plus declared overrides, one function at a time.
5. **Wiki transports.** Release-URL loader first, then the `MediaWiki:` page-tree loader, implemented with the extension.

## Open questions

- Where does compilation run: in Node on the server, in the browser, or both? The pure-function design keeps both possible.
- Do atlas bundles carry their own assets, or does the wiki supply them via `resolveAsset`?
- `.zip` support in addition to `.tar.gz`?
