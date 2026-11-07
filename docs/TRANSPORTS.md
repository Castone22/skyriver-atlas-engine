# Transports and the loader

How a browser gets from "a slug on the wiki" to a rendered atlas, and what the serving side
(the AtlasEmbed extension) must provide. The bundle model is in `docs/BUNDLES.md`.

```
Special:AtlasEmbed/<slug>  →  loader page (one HTML document, sandboxed)
                                 ├─ fetch engine bundle files
                                 ├─ fetch atlas bundle files (and any other bundles it needs)
                                 ├─ compileCore(...) in the browser
                                 └─ document.write(compiled atlas)  (same URL, same sandbox)
```

## What exists

| File                      | Role                                                                    |
| ------------------------- | ----------------------------------------------------------------------- |
| `src/bundle-http.mjs`     | `loadHttp(baseUrl, options)`: HTTP directory transport. Pure, injectable `fetch` |
| `src/host-browser.mjs`    | `createBrowserHost(...)`: a `compileCore` host over HTTP, plus `gzipBase64` |
| `loader/loader.mjs`       | `boot(config)`: load, compile and render                                |
| `loader/index.html`       | The loader page template                                                |
| `tools/build-loader.mjs`  | Inlines the modules into one self-contained loader document             |
| `tools/bundle-manifest.mjs` | Writes or checks the `files` digests in a `bundle.json`               |

## URL layout the extension must serve

Everything is a plain `GET` of a static file. Three URL prefixes (all configurable, shown here
with example values):

```
engine bundle   {engineUrl}                 e.g. https://wiki.example/atlasembed/engine/1.0.0/
                {engineUrl}bundle.json
                {engineUrl}<path>           every path listed in bundle.json "files"

atlas bundles   {bundlesUrl}<id>/           e.g. https://wiki.example/atlasembed/bundles/
                {bundlesUrl}<id>/bundle.json
                {bundlesUrl}<id>/<path>     every path listed in that bundle.json "files"

assets          {assetsUrl}<sha256>         e.g. https://wiki.example/atlasembed/assets/
```

- `<id>` is the bundle's `id` and must match `^[a-z0-9][a-z0-9_-]*$`. **The atlas id is the wiki
  slug**, so a slug must also match `^[a-z0-9][a-z0-9-]{0,79}$`.
- Besides the atlas being rendered, the browser may request other bundles by id: the bundle named
  by the atlas's `renderer` field (for a DSL atlas that is `elysian`, for example) and, for a
  galaxy atlas, each child it lists. An unknown id must answer **404**; the host treats 404 as
  "no such bundle" and other errors as failures.
- Asset `<sha256>` URLs must return the image bytes with the correct `Content-Type`. The loader
  never inlines assets; it only substitutes these URLs for `atlas-asset:<sha256>` references.
- All text files are UTF-8.
- Images are cross-origin in the sandbox, so they must be served with `Access-Control-Allow-Origin: *` and
  requested with CORS (the atlases set `crossOrigin='anonymous'` where they read an image's pixels or use it as a
  WebGL texture). Without the header such an atlas draws nothing; Grand's galaxy and Mahanzk's planet are two.

## The `files` contract

A directory cannot be listed over HTTP, so **a bundle served over HTTP must carry a `files` map
in its `bundle.json`**:

```json
{
  "bundleVersion": 1,
  "type": "atlas",
  "id": "calidor",
  "files": {
    "atlas.json": "<sha256 hex>",
    "shell.html": "<sha256 hex>",
    "style-0.css": "<sha256 hex>",
    "runtime-0.js": "<sha256 hex>"
  }
}
```

- Keys are safe relative paths using `/`: no leading `/`, no `..`, no empty segments, no `\`.
- Values are lowercase hex SHA-256 of the file's **UTF-8 text**.
- It lists every file except `bundle.json` itself. Every part the manifest declares (`atlas`,
  `parts.shell`, `parts.styles`, `parts.runtime`) must appear in it, or validation fails.
- `loadHttp` fetches only what it needs, lazily, once per file. An unlisted file is unreachable.
- Compute it with `node tools/bundle-manifest.mjs <dir>` (add `--check` in CI to fail on stale
  digests). The extension should compute it itself when it unpacks an upload rather than trusting
  an uploaded value; the algorithm is a dozen lines (`computeFiles` in that tool).
- The repository does **not** commit `files` maps: they are an artifact of the bundle's exact
  contents. Source bundles stay valid without them for the directory transport.

Binary files are not supported yet; digests are over text. Assets are the only binary content and
live outside bundles (`assetsUrl`).

## Required headers

The loader runs in an opaque-origin sandbox, so every request it makes is cross-origin.

| Resource                         | Header                                                                       |
| -------------------------------- | ---------------------------------------------------------------------------- |
| All bundle files and assets      | `Access-Control-Allow-Origin: *`                                             |
| Loader page (`Special:AtlasEmbed/<slug>`) | `Content-Security-Policy: sandbox allow-scripts allow-downloads allow-popups allow-popups-to-escape-sandbox` (unchanged from today) |

- Requests are simple `GET`s with no custom headers and `credentials: 'omit'`, so there is no
  preflight, and the wildcard origin is valid. The files are public static data.
- Do not use `Access-Control-Allow-Credentials`; the browser would reject it with `*`.
- No `connect-src` restriction is needed. Do not add one that blocks the bundle host.

## Packs and compression

A first visit to Grand fetches the engine's ~190 small function files and five atlases (4 MB of JSON), one
request each. At ~130 ms a request that took about 12 s. Two measures, both on by serving the right files:

- **Pack.** A bundle's `bundle.json` may carry `"pack": { "file": "functions.pack.json", "prefix": "functions/" }`.
  The pack file is a JSON object mapping each path under the prefix to its text. The loader fetches it once, on
  the first read of a file under the prefix, and takes those files from it; if the pack cannot be fetched it
  falls back to one request per file. The files stay in the bundle and in `files` (so every one is still
  digested, and `verify` checks pack members against those digests). `npm run pack` writes
  `functions.pack.json` into the engine zip; the server just serves it like any other file.
- **Compression.** Serve text responses (`bundle.json`, `atlas.json`, the pack, shells, styles, scripts) with
  `Content-Encoding: gzip` or `br`. The atlas data is JSON and compresses by about 85%: Grand's first load falls
  from about 5.7 MB to about 2 MB.

The loader also compiles a galaxy's child atlases side by side, so their files are fetched together. With the
pack and the parallel compile, Grand's first load under 130 ms of latency fell from about 10.4 s to about 3 s
(223 requests to 39). Later visits are served from the browser cache.

## Caching

The existing `Cache-Control: private, max-age=3600` with no cache busting is wrong for bundles.

- **`bundle.json` and the loader page** carry the identity of a release: serve them with
  `Cache-Control: no-cache` (revalidate, ideally with an `ETag`) or a short `max-age`.
- **Files** can be cached forever if their URL changes when their content does. Set
  `versionParam` in the loader config (for example `"v"`): every file URL then gets
  `?v=<first 16 hex of its sha256>` and the server can answer with
  `Cache-Control: public, max-age=31536000, immutable`. The server may ignore the query string
  when locating the file. `bundle.json` is never versioned.
- **Assets** are already content-addressed by `<sha256>`; serve them as immutable.
- Engine bundles are stored once per version and shared by every atlas, so a visitor downloads
  the engine once and then hits the browser cache for every other atlas.

### Request count

Files are fetched one by one. A stellar atlas needs 117 to 139 function files (Kadaym the fewest, UACS, Elysian and IULR the
most) plus its own five or so; the Grand atlas needs about 33 plus the same again for each of its five children. Under HTTP/2
or HTTP/3 this is fine, and with immutable caching repeat visits cost nothing. If it proves too
slow on a cold cache, the next step is for the extension to serve a pre-concatenated pack of an
engine's functions; the transport interface (`{ files, read }`) does not need to change for that.

## The loader

**The loader ships inside the engine.** The engine's `bundle.json` names it (`"loader": "loader.html"`) and the
file is in its `files`. The page embeds the compiler this engine was built with, so a loader and an engine from
different releases can never meet. To serve `Special:AtlasEmbed/<slug>`, read the loader from **the engine chosen
for that datapack** and fill in the placeholders below. An engine with no `loader` field (an older one) is served
with whatever loader the host already has. `npm run pack` builds the loader into the engine zip.

Build it:

```sh
node tools/build-loader.mjs [out]     # default: build/loader.html (git-ignored)
```

The output is one HTML document with a classic inline `<script>` (no module loading, so it works
under the sandbox with nothing to fetch but data). It has two placeholders for the serving side to
fill in per request:

| Placeholder | Replace with                                                               |
| ----------- | -------------------------------------------------------------------------- |
| `@@TITLE@@` | the atlas title, HTML-escaped (`htmlspecialchars`)                         |
| `@@CONFIG@@` | the config below as JSON, encoded so it cannot close the script element   |

In PHP:

```php
$config = json_encode( $config, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES );
$html = strtr( $loaderHtml, [
    '@@TITLE@@'  => htmlspecialchars( $title ),
    '@@CONFIG@@' => $config,
] );
```

Use `strtr` (which never rescans replaced text), not sequential `str_replace` calls: a title that
contains `@@CONFIG@@` must not be able to inject into the config.

Config:

| Key            | Meaning                                                                      |
| -------------- | ---------------------------------------------------------------------------- |
| `atlas`        | Bundle id to render; equals the slug                                         |
| `engineUrl`    | Directory URL of the engine bundle                                           |
| `bundlesUrl`   | Prefix ending in `/`; bundle `<id>` is at `<bundlesUrl><id>/`                |
| `assetsUrl`    | Prefix; asset `<sha256>` is at `<assetsUrl><sha256>`                         |
| `wikiBase`     | Optional. This wiki's address (`https://wiki.example`, no trailing slash, no query). The page looks up article titles at `<wikiBase>/api.php` and links to `<wikiBase>/index.php`. Set it to the wiki the embed lives on. Without it the engine's default is used |
| `verify`       | Optional. Hash every file as it is fetched and compare with `files`          |
| `versionParam` | Optional. Query parameter name for content-addressed file URLs               |

### Behaviour

1. Fetches `bundle.json` for the engine and the atlas, checks the atlas's `engine` range against
   the engine's version, and fetches only the files it needs.
2. Runs `compileCore` in the browser.
3. Replaces the loader document with the compiled atlas using `document.open()`, `write()` and
   `close()`. The document URL does not change, so `window.location.search` is exactly what the
   embed's `query=` produced and **deep links keep working** (`region`, `system`, `planet`,
   `object`, `view`, `chart`, `focus`, `station`).
4. On failure it logs to the console and replaces the "Loading atlas…" line with
   `Could not load this atlas: <reason>`. It never calls `alert`.

Grand's child atlases are compiled in the same pass (each child bundle is fetched by id) and
embedded as gzip snapshots, which uses `CompressionStream`. Browsers without it get a clear error
for the Grand atlas only; single stellar and geographic atlases do not need it.

## Security notes

- The loader and the atlas it writes stay inside the AtlasEmbed sandbox: opaque origin, no
  `allow-same-origin`, so no access to wiki cookies, session or DOM, and no reliable
  `localStorage`. The loader uses no storage.
- Bundle code (shells, styles, runtime scripts, functions) is executed. Anyone who can write to the
  bundle store can run script in visitors' browsers, but only inside the sandbox. Keep upload
  rights limited to trusted users, as with HTML uploads today.
- `files` digests protect against a truncated or corrupted download and against a stale cache
  serving a mixed set of files. They are not authentication: whoever can write the files can write
  the digests, which is why the extension should compute them. `verify: true` checks every file as
  it arrives and fails the load on any mismatch.
- The config is data, not code: it is parsed with `JSON.parse` from an `application/json` element.
  Encode it with `JSON_HEX_TAG` so `</script>` cannot appear inside it, and HTML-escape the title.
- URLs are built with `new URL()` from the configured prefixes and from paths that passed the
  safe-path check, then fetched with `credentials: 'omit'`.
- `postMessage` inside the written atlas already authenticates by `e.source` and a per-frame
  token, never by `event.origin` (which reads `"null"`). Nothing in the loader changes that.
