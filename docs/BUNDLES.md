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
- **Revisions.** Today re-uploading a slug overwrites it. Bundles carry `version`; the manifest's `files` hashes give cache-safe URLs, so keeping old versions around is optional.
- **Grand.** Child atlases are **live references to child slugs** on the same host, not embedded snapshots. The galaxy atlas lists child ids in `dependencies.children`; the loader resolves each id to a slug and loads it on demand. (The standalone export may still embed snapshots, as today.)

## Engine versioning

The wiki has a single **current engine** setting; every bundle slug renders with it. An atlas's `engine` range is checked at load time and fails with a clear message if the current engine does not satisfy it. Per-atlas pinning is deferred; the manifest's range keeps it possible later.

Because one engine serves every atlas, **backward compatibility is a standing requirement** for engine changes. See `AGENTS.md`.

## Open questions

- How are live child references loaded inside the sandbox: nested iframes of the child slug, or in-page composition?
